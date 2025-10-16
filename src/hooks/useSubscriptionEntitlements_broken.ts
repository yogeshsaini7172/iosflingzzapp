import { useState, useEffect } from "react";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
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

  // Helper function to check subscription from database directly
  const checkDatabaseSubscription = async (firebaseUid: string): Promise<SubscriptionEntitlements | null> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (profileError || !profile) {
        console.log('No profile found in database for Firebase UID:', firebaseUid);
        return null;
      }

      const planId = (profile.plan_id || 'free') as PlanId;
      const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
      
      console.log('🔍 Database subscription check:', { 
        firebaseUid, 
        planId, 
        planDisplay: plan.display_name,
        profileData: profile 
      });

      return {
        plan: {
          id: planId,
          display_name: plan.display_name,
          price: plan.price_monthly_inr,
          expires_at: profile.plan_expires_at
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
      };
    } catch (error) {
      console.error('Error checking database subscription:', error);
      return null;
    }
  };

  const checkEntitlements = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try to get Firebase UID for database check
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        console.log('🔍 Checking database subscription for Firebase UID:', user.id);
        const dbEntitlements = await checkDatabaseSubscription(user.id);
        
        if (dbEntitlements) {
          console.log('✅ Database subscription found:', dbEntitlements);
          setEntitlements(dbEntitlements);
          return;
        }
      }

      // If database check fails, try the API
  const checkEntitlements = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try to get Firebase UID for database check
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        console.log('🔍 Checking database subscription for Firebase UID:', user.id);
        const dbEntitlements = await checkDatabaseSubscription(user.id);
        
        if (dbEntitlements) {
          console.log('✅ Database subscription found:', dbEntitlements);
          setEntitlements(dbEntitlements);
          return;
        }
      }

      // If database check fails, try the API
      console.log('🌐 Trying API subscription check...');
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/subscription-entitlement', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ API subscription found:', data.data);
          setEntitlements(data.data);
          return;
        }
      }

      // If both API and database fail, create default free plan entitlements
      console.log('⚠️ No subscription found, defaulting to free plan');
      throw new Error('No subscription found');
    } catch (err: any) {
      console.error('Error checking entitlements:', err);
      
      // Fallback to demo/local data or default free plan
      const demoProfile = localStorage.getItem('demoProfile');
      let planId: PlanId = 'free';
      let profileData = {};
      
      if (demoProfile) {
        try {
          const profile = JSON.parse(demoProfile);
          planId = (profile.plan_id || profile.subscription_tier || 'free') as PlanId;
          profileData = profile;
        } catch (parseErr) {
          console.error('Error parsing demo profile:', parseErr);
        }
      }
      
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
            used: (profileData as any).daily_swipes_used || 0,
            unlimited: plan.features.unlimited_swipes
          },
          profiles_shown: {
            count: plan.features.profiles_shown_count,
            extra_pairings_left: (profileData as any).extra_pairings_left || 0
          },
          boosts: {
            monthly_limit: plan.features.boosts_per_month,
            remaining: (profileData as any).boosts_remaining || 0
          },
          superlikes: {
            monthly_limit: plan.features.superlikes_per_month,
            remaining: (profileData as any).superlikes_remaining || 0,
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
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (planId: PlanId) => {
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/subscription-entitlement', {
        method: 'POST',
        body: JSON.stringify({ action: 'upgrade', plan_id: planId })
      });

      if (!response.ok) throw new Error('Failed to upgrade plan');
      const data = await response.json();
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
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/subscription-entitlement', {
        method: 'POST',
        body: JSON.stringify({ action: 'downgrade', plan_id: planId })
      });

      if (!response.ok) throw new Error('Failed to downgrade plan');
      const data = await response.json();
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
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/request-extra-pairings', {
        method: 'POST',
        body: JSON.stringify({ count })
      });

      if (!response.ok) throw new Error('Failed to request extra pairings');
      const data = await response.json();
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