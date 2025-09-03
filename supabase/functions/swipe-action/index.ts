import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwipeRequest {
  candidate_id: string;
  direction: 'left' | 'right';
}

async function resetIfNeeded(supabaseClient: any, userId: string) {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('last_reset, subscription_tier')
    .eq('user_id', userId)
    .single();

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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error('User not authenticated');

    const { candidate_id, direction }: SwipeRequest = await req.json();

    // Reset daily limits if needed
    await resetIfNeeded(supabaseClient, user.id);

    // Get user profile to check swipe limits
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('swipes_left')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

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
      .eq('user_id', user.id);

    // Record swipe
    await supabaseClient
      .from('swipes')
      .upsert({
        user_id: user.id,
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
        .eq('candidate_id', user.id)
        .eq('direction', 'right');

      if (candidateSwipes && candidateSwipes.length > 0) {
        // Create match
        const { data: match, error: matchError } = await supabaseClient
          .from('matches')
          .insert({
            liker_id: user.id,
            liked_id: candidate_id,
            status: 'matched',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!matchError && match) {
          matchCreated = true;
          matchId = match.id;
          console.log(`Match created between ${user.id} and ${candidate_id}`);
        }
      }
    }

    console.log(`Swipe recorded | user=${user.id} → ${candidate_id} [${direction}]`);

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