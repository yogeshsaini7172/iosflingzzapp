import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlindDateRequest {
  seen_ids?: string[];
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

    const { seen_ids = [] }: BlindDateRequest = await req.json();

    // Reset daily limits if needed
    await resetIfNeeded(supabaseClient, user.id);

    // Get user profile and check blind date limits
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    if (profile.blinddate_requests_left === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'LIMIT_REACHED', message: 'No blinddate requests left for today.' }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get potential candidates (excluding seen ones)
    let candidatesQuery = supabaseClient
      .from('profiles')
      .select('user_id, first_name, last_name, age, gender, location')
      .neq('user_id', user.id)
      .eq('is_active', true);

    if (seen_ids.length > 0) {
      candidatesQuery = candidatesQuery.not('user_id', 'in', `(${seen_ids.join(',')})`);
    }

    const { data: candidates, error: candidatesError } = await candidatesQuery.limit(50);

    if (candidatesError) throw candidatesError;

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'NO_CANDIDATES', message: 'No new blinddate candidates available.' }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pick one random candidate
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const candidate = candidates[randomIndex];

    // Deduct blind date request
    const newBlindDateLeft = profile.blinddate_requests_left === -1 ? -1 : Math.max(0, profile.blinddate_requests_left - 1);
    await supabaseClient
      .from('profiles')
      .update({ blinddate_requests_left: newBlindDateLeft })
      .eq('user_id', user.id);

    console.log(`Blinddate delivered | user=${user.id} → candidate=${candidate.user_id}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        candidate: {
          id: candidate.user_id,
          name: `${candidate.first_name} ${candidate.last_name}`.trim(),
          age: candidate.age,
          gender: candidate.gender,
          location: candidate.location,
        },
        remaining_blinddate_requests: newBlindDateLeft,
        seen_ids: [...seen_ids, candidate.user_id]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in blind-date function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});