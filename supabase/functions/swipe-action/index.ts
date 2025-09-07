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
        // Create match - check if it already exists first
        const { data: existingMatch } = await supabaseClient
          .from('matches')
          .select('id')
          .or(`and(liker_id.eq.${userId},liked_id.eq.${candidate_id}),and(liker_id.eq.${candidate_id},liked_id.eq.${userId})`)
          .maybeSingle();

        if (!existingMatch) {
          const { data: match, error: matchError } = await supabaseClient
            .from('matches')
            .insert({
              liker_id: userId,
              liked_id: candidate_id,
              status: 'matched',
              created_at: new Date().toISOString()
            })
            .select()
            .maybeSingle();

          if (!matchError && match) {
            matchCreated = true;
            matchId = match.id;
            console.log(`🎉 NEW MATCH created between ${userId} and ${candidate_id}`);

            // Create chat room
            const user1 = userId < candidate_id ? userId : candidate_id;
            const user2 = userId < candidate_id ? candidate_id : userId;
            
            const { data: existingRoom } = await supabaseClient
              .from('chat_rooms')
              .select('id')
              .or(`and(user1_id.eq.${user1},user2_id.eq.${user2}),and(user1_id.eq.${user2},user2_id.eq.${user1})`)
              .maybeSingle();

            if (!existingRoom) {
              const { data: room, error: roomError } = await supabaseClient
                .from('chat_rooms')
                .insert({
                  match_id: match.id,
                  user1_id: user1,
                  user2_id: user2,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .maybeSingle();

              if (roomError) {
                console.error('❌ Chat room creation error:', roomError);
              } else {
                console.log(`✅ Chat room created: ${room?.id} for match ${match.id}`);
              }
            } else {
              console.log(`Chat room already exists: ${existingRoom.id}`);
            }
          } else {
            console.error('❌ Match creation error:', matchError);
          }
        } else {
          console.log(`Match already exists: ${existingMatch.id}`);
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