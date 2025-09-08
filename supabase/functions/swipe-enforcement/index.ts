import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan configuration
const SUBSCRIPTION_PLANS = {
  free: { daily_swipes_limit: 20, unlimited_swipes: false },
  basic_49: { daily_swipes_limit: 50, unlimited_swipes: false },
  plus_89: { daily_swipes_limit: null, unlimited_swipes: true },
  pro_129: { daily_swipes_limit: null, unlimited_swipes: true }
} as const;

interface SwipeRequest {
  candidate_id: string;
  direction: 'left' | 'right';
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SWIPE-ENFORCEMENT] ${step}${detailsStr}`);
};

function resetDailyCountIfNeeded(user: any) {
  const today = new Date().toISOString().split('T')[0];
  const resetDate = user.daily_swipes_reset_at;
  
  if (!resetDate || resetDate < today) {
    logStep("Resetting daily swipe count", { userId: user.user_id, today });
    return {
      ...user,
      daily_swipes_used: 0,
      daily_swipes_reset_at: today
    };
  }
  
  return user;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Swipe enforcement started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');
    
    logStep("User authenticated", { userId: user.id });

    const { candidate_id, direction }: SwipeRequest = await req.json();
    
    if (!candidate_id || !direction) {
      throw new Error('Missing candidate_id or direction');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    const planId = profile.plan_id || 'free';
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
    
    logStep("Profile retrieved", { planId, userId: user.id });

    // Reset daily count if date changed
    let updatedProfile = resetDailyCountIfNeeded(profile);
    let needsProfileUpdate = updatedProfile !== profile;

    // Check swipe limit
    if (!plan.unlimited_swipes) {
      const limit = plan.daily_swipes_limit;
      const used = updatedProfile.daily_swipes_used || 0;
      
      logStep("Checking swipe limits", { limit, used, planId });
      
      if (used >= limit) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Daily swipe limit reached',
          limit_info: {
            limit,
            used,
            plan: planId
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 402, // Payment Required
        });
      }
    }

    // Process the swipe - add to swipes table
    const { error: swipeError } = await supabaseClient
      .from('enhanced_swipes')
      .insert({
        user_id: user.id,
        target_user_id: candidate_id,
        direction: direction === 'right' ? 'like' : 'pass'
      });

    if (swipeError) {
      logStep("Swipe processing error", { error: swipeError.message });
      throw swipeError;
    }

    // Increment swipe count (only if not unlimited)
    if (!plan.unlimited_swipes) {
      updatedProfile.daily_swipes_used = (updatedProfile.daily_swipes_used || 0) + 1;
      needsProfileUpdate = true;
    }

    // Update profile if needed
    if (needsProfileUpdate) {
      const updateData: any = {};
      
      if (updatedProfile.daily_swipes_used !== profile.daily_swipes_used) {
        updateData.daily_swipes_used = updatedProfile.daily_swipes_used;
      }
      
      if (updatedProfile.daily_swipes_reset_at !== profile.daily_swipes_reset_at) {
        updateData.daily_swipes_reset_at = updatedProfile.daily_swipes_reset_at;
      }

      if (Object.keys(updateData).length > 0) {
        logStep("Updating profile swipe counts", updateData);
        
        await supabaseClient
          .from('profiles')
          .update(updateData)
          .eq('user_id', user.id);
      }
    }

    // Handle potential matches for right swipes
    if (direction === 'right') {
      logStep("Processing potential match", { candidateId: candidate_id });
      
      // Check if candidate already swiped right on this user
      const { data: reciprocalSwipe } = await supabaseClient
        .from('enhanced_swipes')
        .select('*')
        .eq('user_id', candidate_id)
        .eq('target_user_id', user.id)
        .eq('direction', 'like')
        .single();

      if (reciprocalSwipe) {
        logStep("Match found! Creating match record");
        
        // Create deterministic ordering for user1/user2 to avoid duplicates
        const user1_id = user.id < candidate_id ? user.id : candidate_id
        const user2_id = user.id < candidate_id ? candidate_id : user.id

        // Check if match already exists
        const { data: existingMatch } = await supabaseClient
          .from('enhanced_matches')
          .select('id, chat_room_id')
          .or(`and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`)
          .maybeSingle();

        if (!existingMatch) {
          try {
            // 1) Create enhanced match
            const { data: newEnhancedMatch, error: matchError } = await supabaseClient
              .from('enhanced_matches')
              .insert({
                user1_id,
                user2_id,
                user1_swiped: true,
                user2_swiped: true,
                status: 'matched',
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (matchError) {
              console.error('Failed to create enhanced match:', matchError);
              throw matchError;
            }

            // 2) Create chat room
            const { data: chatRoom, error: chatRoomErr } = await supabaseClient
              .from('chat_rooms')
              .insert({
                match_id: newEnhancedMatch.id,
                user1_id,
                user2_id,
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (chatRoomErr) {
              console.error('Chat room creation failed:', chatRoomErr);
            }

            // 3) Get profiles for notifications
            const { data: currentProfile } = await supabaseClient
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', user.id)
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
                    other_user_id: user.id
                  },
                  created_at: new Date().toISOString()
                });

              if (notifErr1) console.error('Notification insert failed for candidate:', notifErr1);
            }

            if (currentProfile) {
              const { error: notifErr2 } = await supabaseClient
                .from('notifications')
                .insert({
                  user_id: user.id,
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

            logStep("Match created successfully with chat room and notifications");

          } catch (err) {
            console.error('Error in match creation flow:', err);
            logStep("Match creation failed", { error: err.message });
          }
        } else {
          logStep("Match already exists", { matchId: existingMatch.id });
        }
      }
    }

    const remaining = plan.unlimited_swipes ? null : Math.max(0, plan.daily_swipes_limit - (updatedProfile.daily_swipes_used || 0));
    
    logStep("Swipe processed successfully", { 
      direction, 
      candidateId: candidate_id,
      dailySwipesUsed: updatedProfile.daily_swipes_used,
      remaining 
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        direction,
        daily_swipes_used: updatedProfile.daily_swipes_used || 0,
        daily_swipes_remaining: remaining,
        unlimited: plan.unlimited_swipes,
        plan: planId
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});