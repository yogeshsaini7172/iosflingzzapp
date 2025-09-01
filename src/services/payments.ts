import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  planId: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'Basic profile',
      '5 matches per day',
      'Standard matching'
    ]
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Enhanced profile',
      'Unlimited matches',
      'Advanced filters',
      'Read receipts',
      'Priority support'
    ]
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Starter',
      'Blind date feature',
      'Advanced compatibility',
      'Profile boost',
      'Unlimited rewinds'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Plus',
      'AI-powered matching',
      'Relationship coaching',
      'Premium badges',
      'Exclusive events access'
    ]
  }
];

// This is a mock payment service - in production you'd integrate with Stripe, Razorpay, etc.
export async function createPaymentOrder(
  userId: string,
  planId: string,
  amount: number,
  currency: string = 'USD'
): Promise<PaymentOrder | null> {
  try {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, you'd call your payment provider's API here
    // For now, we'll simulate the order creation
    
    return {
      orderId,
      amount,
      currency,
      planId
    };
  } catch (error) {
    console.error('Error creating payment order:', error);
    return null;
  }
}

export async function processPayment(
  userId: string,
  orderId: string,
  planId: string,
  paymentDetails: any
): Promise<boolean> {
  try {
    // Simulate payment processing
    const isPaymentSuccessful = Math.random() > 0.1; // 90% success rate for demo
    
    if (!isPaymentSuccessful) {
      throw new Error('Payment processing failed');
    }

    // Get plan details
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (plan.interval === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Record subscription in database
    const { error: subscriptionError } = await supabase
      .from("subscription_history")
      .insert({
        user_id: userId,
        tier: planId,
        amount: Math.round(plan.price * 100), // Convert to cents
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        payment_id: orderId
      });

    if (subscriptionError) {
      console.error('Error recording subscription:', subscriptionError);
      throw new Error('Failed to record subscription');
    }

    // Update user profile with new subscription tier
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        subscription_tier: planId,
        subscription_expires_at: endDate.toISOString()
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error('Error updating profile subscription:', profileError);
      // Don't throw error here as subscription is already recorded
    }

    return true;
  } catch (error) {
    console.error('Error processing payment:', error);
    return false;
  }
}

export async function getUserSubscription(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("subscription_history")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

export async function cancelSubscription(userId: string): Promise<boolean> {
  try {
    // Update active subscription to cancelled
    const { error: subscriptionError } = await supabase
      .from("subscription_history")
      .update({ status: 'cancelled' })
      .eq("user_id", userId)
      .eq("status", "active");

    if (subscriptionError) {
      console.error('Error cancelling subscription:', subscriptionError);
      return false;
    }

    // Update profile to free tier (but keep expiry date for grace period)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ subscription_tier: 'free' })
      .eq("user_id", userId);

    if (profileError) {
      console.error('Error updating profile after cancellation:', profileError);
    }

    return true;
  } catch (error) {
    console.error('Error in cancelSubscription:', error);
    return false;
  }
}

export async function getSubscriptionMetrics(): Promise<any> {
  try {
    const { data: totalSubs, error: totalError } = await supabase
      .from("subscription_history")
      .select("tier, amount", { count: 'exact' })
      .eq("status", "active");

    if (totalError) {
      console.error('Error fetching subscription metrics:', totalError);
      return null;
    }

    const metrics = {
      totalSubscribers: totalSubs?.length || 0,
      monthlyRevenue: totalSubs?.reduce((sum, sub) => sum + (sub.amount / 100), 0) || 0,
      planDistribution: {} as Record<string, number>
    };

    // Calculate plan distribution
    totalSubs?.forEach(sub => {
      metrics.planDistribution[sub.tier] = (metrics.planDistribution[sub.tier] || 0) + 1;
    });

    return metrics;
  } catch (error) {
    console.error('Error in getSubscriptionMetrics:', error);
    return null;
  }
}

export function getPlanFeatures(planId: string): string[] {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  return plan?.features || [];
}

export function canAccessFeature(userTier: string, requiredTier: string): boolean {
  const tierHierarchy = ['free', 'starter', 'plus', 'pro'];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex;
}
