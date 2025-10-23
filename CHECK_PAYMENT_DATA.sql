-- Check if subscriptions table has recent payment attempts
SELECT 
  id,
  user_id,
  plan,
  is_active,
  razorpay_order_id,
  razorpay_payment_id,
  payment_completed_at,
  created_at
FROM public.subscriptions
ORDER BY created_at DESC
LIMIT 5;

-- Check if any profiles were updated with subscription info
SELECT 
  user_id,
  first_name,
  subscription_plan,
  subscription_tier,
  plan_id,
  is_subscribed,
  subscription_started_at
FROM public.profiles
WHERE subscription_plan IS NOT NULL 
   OR plan_id NOT IN ('free', 'NULL')
   OR is_subscribed = true
LIMIT 5;

-- Check subscription_history for payment records
SELECT 
  id,
  user_id,
  tier,
  amount,
  payment_id,
  status,
  created_at
FROM public.subscription_history
ORDER BY created_at DESC
LIMIT 5;
