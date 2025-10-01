import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan configuration - must match subscription plans
const SUBSCRIPTION_PLANS = {
  free: { daily_swipes_limit: 20 },
  basic_49: { daily_swipes_limit: 50 },
  plus_89: { daily_swipes_limit: null }, // unlimited
  pro_129: { daily_swipes_limit: null }  // unlimited
} as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DAILY-RESET] Starting daily swipe reset at midnight');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const today = new Date().toISOString().split('T')[0];

    // Get all active profiles that need reset
    const { data: profiles, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('user_id, plan_id, daily_swipes_reset_at')
      .eq('is_active', true)
      .or(`daily_swipes_reset_at.is.null,daily_swipes_reset_at.lt.${today}`);

    if (fetchError) {
      console.error('[DAILY-RESET] Error fetching profiles:', fetchError);
      throw fetchError;
    }

    console.log(`[DAILY-RESET] Found ${profiles?.length || 0} profiles to reset`);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No profiles needed reset',
        count: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Reset all profiles
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        daily_swipes_used: 0,
        daily_swipes_reset_at: today
      })
      .or(`daily_swipes_reset_at.is.null,daily_swipes_reset_at.lt.${today}`);

    if (updateError) {
      console.error('[DAILY-RESET] Error updating profiles:', updateError);
      throw updateError;
    }

    console.log(`[DAILY-RESET] Successfully reset ${profiles.length} profiles`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily swipe reset completed',
      count: profiles.length,
      date: today
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[DAILY-RESET] ERROR:', errorMessage);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
