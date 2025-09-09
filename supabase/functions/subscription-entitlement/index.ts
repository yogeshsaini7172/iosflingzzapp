import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Firebase ID token
async function verifyFirebaseToken(idToken: string) {
  try {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Invalid token format')
    }

    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      throw new Error('Firebase service account not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    
    // Split and validate token structure
    const tokenParts = idToken.split('.')
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT structure')
    }
    
    // Use base64url-safe decoding for JWT payload
    const base64UrlPayload = tokenParts[1]
    if (!base64UrlPayload) {
      throw new Error('Missing token payload')
    }
    
    const base64Payload = base64UrlPayload.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64Payload))
    
    // Validate token claims
    if (!payload.iss?.includes('securetoken.google.com') || 
        !payload.aud?.includes(serviceAccount.project_id) ||
        !payload.sub) {
      throw new Error('Invalid token issuer, audience or subject')
    }
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) {
      throw new Error('Token expired')
    }
    
    return payload.sub // Return Firebase UID
  } catch (error) {
    console.error('Token verification error:', error)
    throw new Error('Invalid or expired token')
  }
}

// Plan configuration - single source of truth
const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    price_monthly_inr: 0,
    display_name: "Free",
    features: {
      daily_swipes_limit: 20,
      profiles_shown_count: 1,
      can_request_extra_pairings: false,
      extra_pairings_on_purchase: 0,
      can_see_who_liked_you: false,
      unlimited_swipes: false,
      boosts_per_month: 0,
      superlikes_per_month: 0,
      priority_matching: false,
      ai_compatibility_insights: false
    }
  },
  basic_49: {
    id: "basic_49",
    price_monthly_inr: 49,
    display_name: "Basic",
    features: {
      daily_swipes_limit: 50,
      profiles_shown_count: 10,
      can_request_extra_pairings: true,
      extra_pairings_on_purchase: 5,
      can_see_who_liked_you: true,
      unlimited_swipes: false,
      boosts_per_month: 1,
      superlikes_per_month: 0,
      priority_matching: false,
      ai_compatibility_insights: false
    }
  },
  plus_89: {
    id: "plus_89",
    price_monthly_inr: 89,
    display_name: "Plus",
    features: {
      daily_swipes_limit: null,
      profiles_shown_count: 10,
      can_request_extra_pairings: true,
      extra_pairings_on_purchase: 5,
      can_see_who_liked_you: true,
      unlimited_swipes: true,
      boosts_per_month: 2,
      superlikes_per_month: 2,
      priority_matching: false,
      ai_compatibility_insights: false
    }
  },
  pro_129: {
    id: "pro_129",
    price_monthly_inr: 129,
    display_name: "Pro",
    features: {
      daily_swipes_limit: null,
      profiles_shown_count: 10,
      can_request_extra_pairings: true,
      extra_pairings_on_purchase: 5,
      can_see_who_liked_you: true,
      unlimited_swipes: true,
      boosts_per_month: 30,
      superlikes_per_month: null,
      priority_matching: true,
      ai_compatibility_insights: true
    }
  }
} as const;

type PlanId = keyof typeof SUBSCRIPTION_PLANS;

interface EntitlementRequest {
  action: 'check' | 'upgrade' | 'downgrade';
  plan_id?: PlanId;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-ENTITLEMENT] ${step}${detailsStr}`);
};

function resetDailyLimitsIfNeeded(user: any, plan: any): any {
  const today = new Date().toISOString().split('T')[0];
  const resetDate = user.daily_swipes_reset_at;
  
  if (!resetDate || resetDate < today) {
    logStep("Resetting daily limits", { userId: user.user_id, lastReset: resetDate, today });
    
    return {
      ...user,
      daily_swipes_used: 0,
      daily_swipes_reset_at: today,
      // Reset monthly quotas if needed (simplified for daily reset)
      boosts_remaining: plan.features.boosts_per_month || 0,
      superlikes_remaining: plan.features.superlikes_per_month === null ? -1 : (plan.features.superlikes_per_month || 0)
    };
  }
  
  return user;
}

function applyPlanLimits(planId: string) {
  const plan = SUBSCRIPTION_PLANS[planId as PlanId];
  if (!plan) throw new Error(`Invalid plan: ${planId}`);
  
  return {
    plan_id: planId,
    plan_started_at: new Date().toISOString(),
    plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    daily_swipes_used: 0,
    daily_swipes_reset_at: new Date().toISOString().split('T')[0],
    extra_pairings_left: plan.features.extra_pairings_on_purchase || 0,
    boosts_remaining: plan.features.boosts_per_month || 0,
    superlikes_remaining: plan.features.superlikes_per_month === null ? -1 : (plan.features.superlikes_per_month || 0),
    priority_score: plan.features.priority_matching ? 10 : 0,
    ai_insights_enabled: plan.features.ai_compatibility_insights,
    can_see_who_liked_you: plan.features.can_see_who_liked_you
  };
}

function formatUserEntitlements(user: any) {
  const planId = user.plan_id || 'free';
  const plan = SUBSCRIPTION_PLANS[planId as PlanId] || SUBSCRIPTION_PLANS.free;
  
  // Apply daily reset if needed
  const updatedUser = resetDailyLimitsIfNeeded(user, plan);
  
  return {
    plan: {
      id: planId,
      display_name: plan.display_name,
      price: plan.price_monthly_inr,
      expires_at: updatedUser.plan_expires_at
    },
    limits: {
      daily_swipes: {
        limit: plan.features.unlimited_swipes ? null : plan.features.daily_swipes_limit,
        used: updatedUser.daily_swipes_used || 0,
        unlimited: plan.features.unlimited_swipes
      },
      profiles_shown: {
        count: plan.features.profiles_shown_count,
        extra_pairings_left: updatedUser.extra_pairings_left || 0
      },
      boosts: {
        monthly_limit: plan.features.boosts_per_month,
        remaining: updatedUser.boosts_remaining || 0
      },
      superlikes: {
        monthly_limit: plan.features.superlikes_per_month,
        remaining: updatedUser.superlikes_remaining || 0,
        unlimited: plan.features.superlikes_per_month === null
      }
    },
    features: {
      can_see_who_liked_you: plan.features.can_see_who_liked_you,
      can_request_extra_pairings: plan.features.can_request_extra_pairings,
      priority_matching: plan.features.priority_matching,
      ai_compatibility_insights: plan.features.ai_compatibility_insights
    },
    updated_fields: updatedUser !== user ? Object.keys(updatedUser) : []
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify Firebase token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header')
    }
    
    const idToken = authHeader.replace('Bearer ', '').trim()
    if (!idToken) {
      throw new Error('No token provided')
    }

    let firebaseUid
    try {
      firebaseUid = await verifyFirebaseToken(idToken)
    } catch (error) {
      throw new Error('Invalid token')
    }
    
    logStep("User authenticated", { userId: firebaseUid });

    const { action, plan_id }: EntitlementRequest = await req.json();

    // Get user profile using Firebase UID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (profileError) {
      logStep("Profile error", { error: profileError.message });
      throw profileError;
    }

    logStep("Profile retrieved", { planId: profile.plan_id, userId: firebaseUid });

    switch (action) {
      case 'check':
        const entitlements = formatUserEntitlements(profile);
        
        // Update profile if daily limits were reset
        if (entitlements.updated_fields.length > 0) {
          logStep("Updating profile with reset limits", { fields: entitlements.updated_fields });
          
          const updatedUser = resetDailyLimitsIfNeeded(profile, SUBSCRIPTION_PLANS[profile.plan_id as PlanId] || SUBSCRIPTION_PLANS.free);
          
          await supabaseClient
            .from('profiles')
            .update({
              daily_swipes_used: updatedUser.daily_swipes_used,
              daily_swipes_reset_at: updatedUser.daily_swipes_reset_at,
              boosts_remaining: updatedUser.boosts_remaining,
              superlikes_remaining: updatedUser.superlikes_remaining
            })
            .eq('firebase_uid', firebaseUid);
        }

        return new Response(JSON.stringify({
          success: true,
          data: entitlements
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'upgrade':
      case 'downgrade':
        if (!plan_id || !(plan_id in SUBSCRIPTION_PLANS)) {
          throw new Error('Invalid plan_id provided');
        }

        const currentPlan = profile.plan_id || 'free';
        const currentPrice = SUBSCRIPTION_PLANS[currentPlan as PlanId]?.price_monthly_inr || 0;
        const targetPrice = SUBSCRIPTION_PLANS[plan_id].price_monthly_inr;

        if (action === 'upgrade' && targetPrice <= currentPrice) {
          throw new Error(`Cannot upgrade to ${plan_id} from ${currentPlan}`);
        }

        if (action === 'downgrade' && targetPrice >= currentPrice) {
          throw new Error(`Cannot downgrade to ${plan_id} from ${currentPlan}`);
        }

        const planLimits = applyPlanLimits(plan_id);
        
        // Update profile with new plan
        await supabaseClient
          .from('profiles')
          .update(planLimits)
          .eq('firebase_uid', firebaseUid);

        // Record subscription history
        await supabaseClient
          .from('subscription_history')
          .insert({
            user_id: firebaseUid,
            tier: plan_id,
            amount: targetPrice,
            status: 'active',
            start_date: planLimits.plan_started_at,
            end_date: planLimits.plan_expires_at
          });

        logStep(`Plan ${action}d`, { from: currentPlan, to: plan_id, userId: firebaseUid });

        const updatedProfile = { ...profile, ...planLimits };
        return new Response(JSON.stringify({
          success: true,
          data: formatUserEntitlements(updatedProfile),
          message: `Successfully ${action}d to ${SUBSCRIPTION_PLANS[plan_id].display_name}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

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