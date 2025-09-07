import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_PLANS, type PlanId, type PlanFeatures } from "@/config/subscriptionPlans";

interface SubscriptionEntitlements {
  plan: {
    id: PlanId;
    display_name: string;
    price: number;
    expires_at?: string;
  };
  limits: {
    daily_swipes: {
      limit: number | null;
      used: number;
      unlimited: boolean;
    };
    profiles_shown: {
      count: number;
      extra_pairings_left: number;
    };
    boosts: {
      monthly_limit: number;
      remaining: number;
    };
    superlikes: {
      monthly_limit: number | null;
      remaining: number;
      unlimited: boolean;
    };
  };
  features: {
    can_see_who_liked_you: boolean;
    can_request_extra_pairings: boolean;
    priority_matching: boolean;
    ai_compatibility_insights: boolean;
  };
}

export function useSubscriptionEntitlements() {
  const [entitlements, setEntitlements] = useState<SubscriptionEntitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkEntitlements = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await supabase.functions.invoke('subscription-entitlement', {
        body: { action: 'check' }
      });

      if (apiError) throw apiError;

      if (data.success) {
        setEntitlements(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch entitlements');
      }
    } catch (err: any) {
      console.error('Error checking entitlements:', err);
      
      // Fallback to demo/local data
      const demoProfile = localStorage.getItem('demoProfile');
      if (demoProfile) {
        const profile = JSON.parse(demoProfile);
        const planId = (profile.plan_id || profile.subscription_tier || 'free') as PlanId;
        const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
        
        setEntitlements({
          plan: {
            id: planId,
            display_name: plan.display_name,
            price: plan.price_monthly_inr
          },
          limits: {
            daily_swipes: {
              limit: plan.features.unlimited_swipes ? null : plan.features.daily_swipes_limit,
              used: profile.daily_swipes_used || 0,
              unlimited: plan.features.unlimited_swipes
            },
            profiles_shown: {
              count: plan.features.profiles_shown_count,
              extra_pairings_left: profile.extra_pairings_left || 0
            },
            boosts: {
              monthly_limit: plan.features.boosts_per_month,
              remaining: profile.boosts_remaining || 0
            },
            superlikes: {
              monthly_limit: plan.features.superlikes_per_month,
              remaining: profile.superlikes_remaining || 0,
              unlimited: plan.features.superlikes_per_month === null
            }
          },
          features: {
            can_see_who_liked_you: plan.features.can_see_who_liked_you,
            can_request_extra_pairings: plan.features.can_request_extra_pairings,
            priority_matching: plan.features.priority_matching,
            ai_compatibility_insights: plan.features.ai_compatibility_insights
          }
        });
      } else {
        setError(err.message || 'Failed to load subscription data');
      }
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (planId: PlanId) => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-entitlement', {
        body: { action: 'upgrade', plan_id: planId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setEntitlements(data.data);
      return { success: true, message: data.message };
    } catch (err: any) {
      console.error('Error upgrading plan:', err);
      return { success: false, error: err.message };
    }
  };

  const downgradePlan = async (planId: PlanId) => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-entitlement', {
        body: { action: 'downgrade', plan_id: planId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setEntitlements(data.data);
      return { success: true, message: data.message };
    } catch (err: any) {
      console.error('Error downgrading plan:', err);
      return { success: false, error: err.message };
    }
  };

  const requestExtraPairings = async (count: number = 1) => {
    try {
      const { data, error } = await supabase.functions.invoke('request-extra-pairings', {
        body: { count }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Refresh entitlements after requesting extra pairings
      await checkEntitlements();
      
      return { success: true, data: data.data };
    } catch (err: any) {
      console.error('Error requesting extra pairings:', err);
      return { success: false, error: err.message };
    }
  };

  const canSwipe = (): boolean => {
    if (!entitlements) return false;
    const { limits } = entitlements;
    
    if (limits.daily_swipes.unlimited) return true;
    return limits.daily_swipes.used < (limits.daily_swipes.limit || 0);
  };

  const getRemainingSwipes = (): number | null => {
    if (!entitlements) return null;
    const { limits } = entitlements;
    
    if (limits.daily_swipes.unlimited) return null;
    return Math.max(0, (limits.daily_swipes.limit || 0) - limits.daily_swipes.used);
  };

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!entitlements) return false;
    return Boolean(entitlements.features[feature as keyof typeof entitlements.features]);
  };

  useEffect(() => {
    checkEntitlements();
  }, []);

  return {
    entitlements,
    loading,
    error,
    checkEntitlements,
    upgradePlan,
    downgradePlan,
    requestExtraPairings,
    canSwipe,
    getRemainingSwipes,
    hasFeature
  };
}