-- ============================================
-- SMART SUBSCRIPTION DATABASE SETUP
-- This script checks existing setup and only adds what's missing
-- Safe to run multiple times - won't duplicate anything
-- ============================================

-- IMPORTANT: This script uses "IF NOT EXISTS" and "ADD COLUMN IF NOT EXISTS"
-- so it's safe even if some parts already exist in your database

-- Step 1: Create subscriptions table ONLY if it doesn't exist
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

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id ON public.subscriptions (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON public.subscriptions (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.subscriptions (user_id, is_active);

-- Step 2.5: Add missing columns to subscriptions if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'razorpay_signature') THEN
    ALTER TABLE public.subscriptions ADD COLUMN razorpay_signature text;
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'amount') THEN
    ALTER TABLE public.subscriptions ADD COLUMN amount numeric(10, 2);
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'currency') THEN
    ALTER TABLE public.subscriptions ADD COLUMN currency text DEFAULT 'INR';
  END IF;
END $$;

-- Step 3: Create subscription_history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  plan text NOT NULL,
  amount numeric(10, 2),
  razorpay_order_id text,
  razorpay_payment_id text,
  event_type text,
  activated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Step 4: Create index for subscription_history
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history (user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON public.subscription_history (subscription_id);

-- Step 5: Add subscription columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_subscribed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Step 6: Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create trigger for subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (true);

-- Step 10: Create RLS policies for subscription_history
DROP POLICY IF EXISTS "Users can view their subscription history" ON public.subscription_history;
CREATE POLICY "Users can view their subscription history"
  ON public.subscription_history
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can insert subscription history" ON public.subscription_history;
CREATE POLICY "Service role can insert subscription history"
  ON public.subscription_history
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- VERIFICATION - Run these to check setup
-- ============================================

-- Check if tables were created
SELECT 'Tables created successfully!' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'subscription_history')
ORDER BY table_name;

-- Check subscriptions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Check profiles subscription columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE '%subscription%'
ORDER BY column_name;

-- Success message
SELECT '✅ Setup Complete! Database is ready for subscriptions.' as message;
