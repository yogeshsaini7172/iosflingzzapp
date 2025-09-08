import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwipeRequest {
  user_id?: string;
  candidate_id: string;
  direction: 'left' | 'right';
}

async function resetIfNeeded(supabaseClient: any, userId: string) {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('last_reset, subscription_tier')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return;

  const lastReset = new Date(profile.last_reset);
  const now = new Date();
  const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceReset >= 1) {
    // Reset daily limits
    const subscriptionLimits = {
      free: { swipes: 20, pairing: 1, blinddate: 0 },
      basic: { swipes: -1, pairing: 10, blinddate: 2 },
      plus: { swipes: -1, pairing: 15, blinddate: 4 },
      premium: { swipes: -1, pairing: 20, blinddate: -1 }
    };

    const tier = profile.subscription_tier || 'free';
    const limits = subscriptionLimits[tier as keyof typeof subscriptionLimits] || subscriptionLimits.free;

    await supabaseClient
      .from('profiles')
      .update({
        swipes_left: limits.swipes,
        pairing_requests_left: limits.pairing,
        blinddate_requests_left: limits.blinddate,
        daily_outgoing_matches: 0,
        daily_incoming_matches: 0,
        last_reset: now.toISOString()
      })
      .eq('user_id', userId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Try to get user from JWT, but allow fallback to body.user_id for demo
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const { data } = token ? await supabaseClient.auth.getUser(token) : { data: { user: null } } as any;
    const authedUser = data?.user;

    const { user_id: bodyUserId, candidate_id, direction }: SwipeRequest = await req.json();
    const userId = authedUser?.id || bodyUserId;
    if (!userId) throw new Error('User not authenticated');

    // Reset daily limits if needed
    await resetIfNeeded(supabaseClient, userId);

    // Get user profile to check swipe limits - create if doesn't exist
    let { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('swipes_left, subscription_tier')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw profileError;
    }

    if (!profile) {
      // Create default profile for demo user
      console.log(`Creating demo profile for user: ${userId}`);
      const { data: newProfile, error: createError } = await supabaseClient
        .from('profiles')
        .insert({
          user_id: userId,
          first_name: 'Demo',
          last_name: 'User',
          email: `${userId}@demo.com`,
          date_of_birth: '2000-01-01',
          gender: 'prefer_not_to_say',
          university: 'Demo University',
          swipes_left: 20,
          subscription_tier: 'free',
          is_active: true,
          last_active: new Date().toISOString()
        })
        .select('swipes_left, subscription_tier')
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        throw createError;
      }
      
      profile = newProfile;
    }

    if (profile.swipes_left === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'LIMIT_REACHED', message: 'No swipes left for today.' }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct swipe
    const newSwipesLeft = profile.swipes_left === -1 ? -1 : Math.max(0, profile.swipes_left - 1);
    await supabaseClient
      .from('profiles')
      .update({ swipes_left: newSwipesLeft })
      .eq('user_id', userId);

    // Record swipe (in base swipes table for analytics)
    await supabaseClient
      .from('swipes')
      .upsert({
        user_id: userId,
        candidate_id,
        direction,
        created_at: new Date().toISOString()
      });

    let matchCreated = false;
    let matchId = null;

    // Handle right swipe - check for mutual match
    if (direction === 'right') {
      const { data: candidateSwipes } = await supabaseClient
        .from('swipes')
        .select('*')
        .eq('user_id', candidate_id)
        .eq('candidate_id', userId)
        .eq('direction', 'right');

      if (candidateSwipes && candidateSwipes.length > 0) {
        // Create deterministic ordering for user1/user2 to avoid duplicates
        const user1_id = userId < candidate_id ? userId : candidate_id
        const user2_id = userId < candidate_id ? candidate_id : userId

        // Check if enhanced match already exists
        const { data: existingEnhancedMatch } = await supabaseClient
          .from('enhanced_matches')
          .select('id, chat_room_id')
          .or(`and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`)
          .maybeSingle();

        if (!existingEnhancedMatch) {
          try {
            // 1) Create enhanced match
            const { data: newEnhancedMatch, error: emError } = await supabaseClient
              .from('enhanced_matches')
              .insert({
                user1_id,
                user2_id,
                status: 'matched',
                user1_swiped: true,
                user2_swiped: true,
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (emError) {
              console.error('Failed to insert enhanced_match:', emError);
              throw emError;
            }

            matchCreated = true;
            matchId = newEnhancedMatch.id;

            // 2) Create chat room
            const { data: chatRoom, error: chatRoomErr } = await supabaseClient
              .from('chat_rooms')
              .insert({
                match_id: newEnhancedMatch.id,
                user1_id,
                user2_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (chatRoomErr) {
              console.error('Chat room creation failed:', chatRoomErr);
            } else {
              console.log(`✅ Chat room created: ${chatRoom.id} for match ${newEnhancedMatch.id}`);
            }

            // 3) Get profiles for notifications
            const { data: currentProfile } = await supabaseClient
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', userId)
              .single();

            const { data: candidateProfile } = await supabaseClient
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', candidate_id)
              .single();

            // 4) Insert notifications for both users
            if (candidateProfile) {
              const { error: notifErr1 } = await supabaseClient
                .from('notifications')
                .insert({
                  user_id: candidate_id,
                  type: 'new_match',
                  title: 'It\'s a match! 🎉',
                  message: `You and ${currentProfile?.first_name || 'someone'} liked each other!`,
                  data: { 
                    enhanced_match_id: newEnhancedMatch.id, 
                    chat_room_id: chatRoom?.id || null,
                    other_user_id: userId
                  },
                  created_at: new Date().toISOString()
                });

              if (notifErr1) console.error('Notification insert failed for candidate:', notifErr1);
            }

            if (currentProfile) {
              const { error: notifErr2 } = await supabaseClient
                .from('notifications')
                .insert({
                  user_id: userId,
                  type: 'new_match',
                  title: 'It\'s a match! 🎉',
                  message: `You and ${candidateProfile?.first_name || 'someone'} liked each other!`,
                  data: { 
                    enhanced_match_id: newEnhancedMatch.id, 
                    chat_room_id: chatRoom?.id || null,
                    other_user_id: candidate_id
                  },
                  created_at: new Date().toISOString()
                });

              if (notifErr2) console.error('Notification insert failed for current:', notifErr2);
            }

            // 5) Optional: Create legacy match for backwards compatibility
            const { error: legacyMatchErr } = await supabaseClient
              .from('matches')
              .insert({
                liker_id: userId,
                liked_id: candidate_id,
                status: 'matched',
                created_at: new Date().toISOString()
              });

            if (legacyMatchErr) console.warn('Legacy matches insertion warning:', legacyMatchErr);

            console.log(`🎉 NEW MATCH created between ${userId} and ${candidate_id}`);

          } catch (err) {
            console.error('Error in match creation flow:', err);
            // Don't throw here, let response continue
          }
        } else {
          matchCreated = true;
          matchId = existingEnhancedMatch.id;
          console.log(`Enhanced match already exists: ${existingEnhancedMatch.id}`);
        }
      }
    }

    console.log(`Swipe recorded | user=${userId} → ${candidate_id} [${direction}]`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        swipe: direction,
        candidate_id,
        match: matchCreated,
        match_id: matchId,
        remaining_swipes: newSwipesLeft
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in swipe-action function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});