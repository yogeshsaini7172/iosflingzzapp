// Single source of truth for subscription plan configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    price_monthly_inr: 0,
    display_name: "Free",
    features: {
      daily_swipes_limit: 20,
      daily_pairing_limit: 1, // Free users get 1 pairing request per day
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
  basic_69: {
    id: "basic_69",
    price_monthly_inr: 69,
    display_name: "Basic",
    features: {
      daily_swipes_limit: 100,
      daily_pairing_limit: 5, // Basic plan: 5 pairing requests per day
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
  standard_129: {
    id: "standard_129",
    price_monthly_inr: 129,
    display_name: "Standard",
    features: {
      daily_swipes_limit: null, // Unlimited swipes
      daily_pairing_limit: 10, // Standard plan: 10 pairing requests per day
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
  premium_243: {
    id: "premium_243",
    price_monthly_inr: 243,
    display_name: "Premium",
    features: {
      daily_swipes_limit: null, // Unlimited swipes
      daily_pairing_limit: 20, // Premium plan: 20 pairing requests per day
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
export const PLAN_HIERARCHY = ['free', 'basic_69', 'standard_129', 'premium_243'] as const;

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