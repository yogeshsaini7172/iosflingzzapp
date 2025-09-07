// Single source of truth for subscription plan configuration
export const SUBSCRIPTION_PLANS = {
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

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[PlanId];
export type PlanFeatures = SubscriptionPlan['features'];

// Utility functions
export function getPlan(planId: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS[planId as PlanId] || null;
}

export function getPlanPrice(planId: string): number {
  const plan = getPlan(planId);
  return plan?.price_monthly_inr || 0;
}

export function hasFeature(planId: string, feature: keyof PlanFeatures): boolean {
  const plan = getPlan(planId);
  return Boolean(plan?.features[feature]);
}

export function getFeatureValue<T extends keyof PlanFeatures>(
  planId: string, 
  feature: T
): PlanFeatures[T] | null {
  const plan = getPlan(planId);
  return plan?.features[feature] || null;
}

// Check if a plan allows unlimited usage of a feature
export function isUnlimited(planId: string, feature: 'daily_swipes_limit' | 'superlikes_per_month'): boolean {
  const value = getFeatureValue(planId, feature);
  return value === null;
}

// Get all available plan IDs
export const PLAN_IDS = Object.keys(SUBSCRIPTION_PLANS) as PlanId[];

// Plan hierarchy for upgrades/downgrades
export const PLAN_HIERARCHY = ['free', 'basic_49', 'plus_89', 'pro_129'] as const;

export function canUpgradeTo(currentPlan: string, targetPlan: string): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan as any);
  const targetIndex = PLAN_HIERARCHY.indexOf(targetPlan as any);
  return targetIndex > currentIndex;
}

export function canDowngradeTo(currentPlan: string, targetPlan: string): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan as any);
  const targetIndex = PLAN_HIERARCHY.indexOf(targetPlan as any);
  return targetIndex < currentIndex;
}