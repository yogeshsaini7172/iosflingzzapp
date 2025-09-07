import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan configuration
const SUBSCRIPTION_PLANS = {
  free: { can_request_extra_pairings: false },
  basic_49: { can_request_extra_pairings: true },
  plus_89: { can_request_extra_pairings: true },
  pro_129: { can_request_extra_pairings: true }
} as const;

interface ExtraPairingRequest {
  count?: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REQUEST-EXTRA-PAIRINGS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Extra pairings request started");

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

    const { count = 1 }: ExtraPairingRequest = await req.json();
    
    if (count < 1 || count > 10) {
      throw new Error('Count must be between 1 and 10');
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
    
    logStep("Profile retrieved", { planId, extraPairingsLeft: profile.extra_pairings_left });

    // Check if plan allows extra pairings
    if (!plan.can_request_extra_pairings) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Plan does not support extra pairing requests',
        plan_info: {
          id: planId,
          can_request_extra_pairings: false
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Check if user has enough extra pairings
    const extraPairingsLeft = profile.extra_pairings_left || 0;
    if (extraPairingsLeft < count) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Not enough extra pairings available',
        available: extraPairingsLeft,
        requested: count
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Deduct extra pairings
    const newExtraPairings = extraPairingsLeft - count;
    
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        extra_pairings_left: newExtraPairings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      logStep("Update error", { error: updateError.message });
      throw updateError;
    }

    logStep("Extra pairings consumed", { 
      consumed: count, 
      remaining: newExtraPairings,
      userId: user.id 
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        consumed: count,
        extra_pairings_left: newExtraPairings,
        message: `${count} extra pairing${count > 1 ? 's' : ''} activated`
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