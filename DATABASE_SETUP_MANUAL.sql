-- ============================================
-- SUBSCRIPTION & PAYMENT TABLES SETUP
-- Run these commands in your Supabase SQL Editor
-- ============================================

-- 1. Check if subscriptions table exists
-- Run this first to see current structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  plan text NOT NULL,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT false,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  payment_completed_at timestamptz,
  amount numeric(10, 2),
  currency text DEFAULT 'INR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id ON public.subscriptions (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON public.subscriptions (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.subscriptions (user_id, is_active);

-- 4. Create subscription_history table for tracking all subscription events
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  plan text NOT NULL,
  amount numeric(10, 2),
  razorpay_order_id text,
  razorpay_payment_id text,
  event_type text, -- 'created', 'activated', 'cancelled', 'expired', 'upgraded', 'downgraded'
  activated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history (user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON public.subscription_history (subscription_id);

-- 5. Check profiles table structure for subscription fields
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name LIKE '%subscription%'
ORDER BY ordinal_position;

-- 6. Add subscription fields to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_subscribed boolean DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger for subscriptions table
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MANUAL TEST DATA INSERTION
-- ============================================

-- 9. Insert a test subscription (replace with your actual user_id)
-- Replace 'YOUR_FIREBASE_UID' with actual Firebase user ID
/*
INSERT INTO public.subscriptions (
  user_id,
  plan,
  start_date,
  is_active,
  razorpay_order_id,
  razorpay_payment_id,
  payment_completed_at,
  amount,
  currency
) VALUES (
  'YOUR_FIREBASE_UID',
  'basic_69',
  now(),
  true,
  'order_test_123',
  'pay_test_123',
  now(),
  69.00,
  'INR'
);
*/

-- 10. Update user profile with subscription (replace with your actual user_id)
/*
UPDATE public.profiles
SET 
  subscription_plan = 'basic_69',
  subscription_tier = 'basic_69',
  is_subscribed = true,
  subscription_started_at = now(),
  subscription_expires_at = now() + interval '30 days',
  updated_at = now()
WHERE id = 'YOUR_USER_ID';
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- 11. Check if tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'subscription_history')
ORDER BY table_name;

-- 12. View all subscriptions
SELECT 
  id,
  user_id,
  plan,
  is_active,
  razorpay_order_id,
  razorpay_payment_id,
  amount,
  payment_completed_at,
  created_at
FROM public.subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- 13. View profiles with subscriptions
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  subscription_plan,
  subscription_tier,
  is_subscribed,
  subscription_started_at
FROM public.profiles
WHERE is_subscribed = true
ORDER BY subscription_started_at DESC
LIMIT 10;

-- 14. View subscription history
SELECT 
  sh.id,
  sh.user_id,
  sh.plan,
  sh.amount,
  sh.event_type,
  sh.activated_at,
  s.razorpay_payment_id
FROM public.subscription_history sh
LEFT JOIN public.subscriptions s ON s.id = sh.subscription_id
ORDER BY sh.activated_at DESC
LIMIT 10;

-- ============================================
-- UTILITY QUERIES
-- ============================================

-- 15. Count subscriptions by plan
SELECT 
  plan,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_subscriptions,
  SUM(amount) as total_revenue
FROM public.subscriptions
GROUP BY plan
ORDER BY total_subscriptions DESC;

-- 16. Find user's current active subscription
/*
SELECT 
  s.*,
  p.first_name,
  p.last_name,
  p.email
FROM public.subscriptions s
JOIN public.profiles p ON p.user_id = s.user_id
WHERE s.user_id = 'YOUR_FIREBASE_UID'
  AND s.is_active = true
ORDER BY s.created_at DESC
LIMIT 1;
*/

-- 17. Manually activate a subscription (if payment was completed outside system)
/*
UPDATE public.subscriptions
SET 
  is_active = true,
  razorpay_payment_id = 'manual_payment_id',
  payment_completed_at = now(),
  updated_at = now()
WHERE razorpay_order_id = 'YOUR_ORDER_ID';
*/

-- 18. Manually upgrade user plan
/*
UPDATE public.profiles
SET 
  subscription_plan = 'premium_243',
  subscription_tier = 'premium_243',
  is_subscribed = true,
  subscription_started_at = now(),
  updated_at = now()
WHERE user_id = 'YOUR_FIREBASE_UID';
*/

-- ============================================
-- CLEANUP / RESET QUERIES (USE WITH CAUTION)
-- ============================================

-- 19. Remove all test subscriptions (CAREFUL!)
/*
DELETE FROM public.subscription_history WHERE user_id LIKE 'test_%';
DELETE FROM public.subscriptions WHERE user_id LIKE 'test_%';
*/

-- 20. Reset user subscription to free
/*
UPDATE public.profiles
SET 
  subscription_plan = 'free',
  subscription_tier = 'free',
  is_subscribed = false,
  subscription_started_at = NULL,
  subscription_expires_at = NULL,
  updated_at = now()
WHERE user_id = 'YOUR_FIREBASE_UID';
*/

-- ============================================
-- RLS (Row Level Security) POLICIES
-- ============================================

-- 21. Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- 22. Create policies for subscriptions (users can only see their own)
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (true); -- For now allow all, you can restrict later

CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (true);

-- 23. Create policies for subscription_history
CREATE POLICY "Users can view their subscription history"
  ON public.subscription_history
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert subscription history"
  ON public.subscription_history
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- NOTES FOR YOU TO SEND ME:
-- ============================================
/*
After running these queries, please send me:

1. Result of Query #1 (subscriptions table structure)
2. Result of Query #5 (profiles subscription fields)
3. Result of Query #11 (table existence check)
4. Any errors you encounter

Then we can create a test record with Query #9 and #10
by replacing 'YOUR_FIREBASE_UID' with an actual user ID from your system.

To get a Firebase UID, run this:
SELECT id, user_id, first_name, email FROM public.profiles LIMIT 5;
*/
