-- Check subscription_history table structure
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscription_history'
ORDER BY ordinal_position;

-- Check if there's data in subscriptions table
SELECT 
  id,
  user_id,
  plan,
  is_active,
  razorpay_order_id,
  razorpay_payment_id,
  payment_completed_at
FROM public.subscriptions
LIMIT 5;
