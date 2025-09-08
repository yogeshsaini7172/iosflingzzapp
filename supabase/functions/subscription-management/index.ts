import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRequest {
  action: 'upgrade' | 'downgrade' | 'status' | 'set';
  plan?: 'free' | 'basic' | 'plus' | 'premium';
  user_id?: string; // optional fallback when no Supabase auth
}

const SUBSCRIPTIONS = {
  free: {
    price: 0,
    pairing: 1,
    blinddate: 0,
    swipes: 20,
    extra_pairing_per_request: 5
  },
  basic: {
    price: 49,
    pairing: 10,
    blinddate: 2,
    swipes: -1,
    extra_pairing_per_request: 5
  },
  plus: {
    price: 89,
    pairing: 15,
    blinddate: 4,
    swipes: -1,
    extra_pairing_per_request: 5
  },
  premium: {
    price: 129,
    pairing: 20,
    blinddate: -1,
    swipes: -1,
    extra_pairing_per_request: 5
  }
};

function formatUserStatus(user: any) {
  const plan = user.subscription_tier || 'free';
  const planDetails = SUBSCRIPTIONS[plan as keyof typeof SUBSCRIPTIONS] || SUBSCRIPTIONS.free;

  return {
    subscription: plan,
    features: {
      price: planDetails.price,
      pairing_limit: planDetails.pairing,
      blinddate_limit: planDetails.blinddate,
      swipe_limit: planDetails.swipes,
    },
    remaining: {
      pairings: user.pairing_requests_left || 0,
      blinddates: user.blinddate_requests_left || 0,
      swipes: user.swipes_left || 0,
    }
  };
}

function getPlanPrice(plan: string): number {
  return SUBSCRIPTIONS[plan as keyof typeof SUBSCRIPTIONS]?.price || 0;
}

async function applySubscriptionLimits(supabaseClient: any, userId: string, tier: string) {
  const limits = SUBSCRIPTIONS[tier as keyof typeof SUBSCRIPTIONS] || SUBSCRIPTIONS.free;
  
  // Update user profile with new tier and limits
  await supabaseClient
    .from('profiles')
    .update({
      subscription_tier: tier,
      pairing_requests_left: limits.pairing,
      blinddate_requests_left: limits.blinddate,
      swipes_left: limits.swipes
    })
    .eq('user_id', userId);

  // Update or create subscription limits record
  await supabaseClient
    .from('subscription_limits')
    .upsert({
      user_id: userId,
      subscription_tier: tier,
      pairing_limit: limits.pairing,
      blinddate_limit: limits.blinddate,
      swipe_limit: limits.swipes,
      updated_at: new Date().toISOString()
    });
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

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    let authedUserId: string | null = null;
    if (token) {
      try {
        const { data } = await supabaseClient.auth.getUser(token);
        authedUserId = data.user?.id ?? null;
      } catch (_e) {
        authedUserId = null;
      }
    }

    const { action, plan, user_id }: SubscriptionRequest = await req.json();
    const targetUserId = authedUserId || user_id;
    if (!targetUserId) throw new Error('User not authenticated and no user_id provided');

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (profileError) throw profileError;

    const currentPlan = profile.subscription_tier || 'free';

    switch (action) {
      case 'upgrade':
        if (!plan || !(plan in SUBSCRIPTIONS)) {
          throw new Error('Invalid subscription plan');
        }

        if (getPlanPrice(plan) <= getPlanPrice(currentPlan)) {
          throw new Error(`Cannot upgrade to ${plan} from ${currentPlan}`);
        }

        await applySubscriptionLimits(supabaseClient, targetUserId, plan);

        // Record subscription history
        await supabaseClient
          .from('subscription_history')
          .insert({
            user_id: targetUserId,
            tier: plan,
            amount: SUBSCRIPTIONS[plan].price,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          });

        const upgradedProfile = { ...profile, subscription_tier: plan };
        return new Response(JSON.stringify({
          success: true,
          data: formatUserStatus(upgradedProfile),
          message: `Subscription upgraded from ${currentPlan} to ${plan}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'downgrade':
        const downgradePlan = plan || 'free';
        if (!(downgradePlan in SUBSCRIPTIONS)) {
          throw new Error('Invalid subscription plan');
        }

        if (getPlanPrice(downgradePlan) >= getPlanPrice(currentPlan)) {
          throw new Error(`Cannot downgrade to ${downgradePlan} from ${currentPlan}`);
        }

        await applySubscriptionLimits(supabaseClient, targetUserId, downgradePlan);

        // Record subscription history
        await supabaseClient
          .from('subscription_history')
          .insert({
            user_id: targetUserId,
            tier: downgradePlan,
            amount: SUBSCRIPTIONS[downgradePlan as keyof typeof SUBSCRIPTIONS].price,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

        const downgradedProfile = { ...profile, subscription_tier: downgradePlan };
        return new Response(JSON.stringify({
          success: true,
          data: formatUserStatus(downgradedProfile),
          message: `Subscription downgraded from ${currentPlan} to ${downgradePlan}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'status':
        return new Response(JSON.stringify({
          success: true,
          data: formatUserStatus(profile),
          message: 'Subscription status fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'set':
        if (!plan || !(plan in SUBSCRIPTIONS)) {
          throw new Error('Invalid subscription plan');
        }
        await applySubscriptionLimits(supabaseClient, targetUserId, plan);
        return new Response(JSON.stringify({
          success: true,
          data: { subscription: plan },
          message: `Subscription set to ${plan}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in subscription-management function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});