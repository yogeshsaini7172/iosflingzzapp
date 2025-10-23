-- ============================================
-- PAYMENT DEBUGGING QUERIES
-- Run these to check if payments are being processed
-- ============================================

-- 1. Check recent subscription orders
SELECT 
  'SUBSCRIPTIONS TABLE' as table_name,
  id as subscription_id,
  user_id,
  plan,
  is_active,
  razorpay_order_id,
  razorpay_payment_id,
  payment_completed_at,
  created_at,
  updated_at
FROM public.subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if profiles were updated
SELECT 
  'PROFILES - SUBSCRIPTION COLUMNS' as table_name,
  user_id,
  first_name,
  subscription_plan,
  subscription_tier,
  plan_id,
  is_subscribed,
  subscription_started_at,
  subscription_expires_at,
  plan_started_at,
  plan_expires_at
FROM public.profiles
WHERE user_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- 3. Check subscription history
SELECT 
  'SUBSCRIPTION_HISTORY TABLE' as table_name,
  id,
  user_id,
  tier,
  amount,
  payment_id,
  status,
  start_date,
  end_date,
  created_at
FROM public.subscription_history
ORDER BY created_at DESC
LIMIT 10;

-- 4. Count payment statuses
SELECT 
  'PAYMENT STATUS COUNT' as info,
  is_active,
  COUNT(*) as count,
  COUNT(razorpay_payment_id) as completed_payments,
  COUNT(razorpay_order_id) as orders_created
FROM public.subscriptions
GROUP BY is_active;

-- ============================================
-- INSTRUCTIONS:
-- 1. Run all queries above
-- 2. Take a screenshot or copy results
-- 3. Try making a test payment
-- 4. Run these queries again
-- 5. Compare to see if data changed
-- ============================================
