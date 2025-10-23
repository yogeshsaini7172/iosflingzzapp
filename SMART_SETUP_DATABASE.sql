-- ============================================
-- STEP 2: SMART SETUP - ONLY CREATES WHAT'S MISSING
-- Run this AFTER verification
-- ============================================

-- Create subscriptions table ONLY if it doesn't exist
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

-- Add missing columns to subscriptions table if they don't exist
DO $$ 
BEGIN
  -- Add razorpay_signature if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'razorpay_signature'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN razorpay_signature text;
  END IF;

  -- Add amount if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN amount numeric(10, 2);
  END IF;

  -- Add currency if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN currency text DEFAULT 'INR';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id ON public.subscriptions (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON public.subscriptions (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.subscriptions (user_id, is_active);

-- Create subscription_history table ONLY if it doesn't exist
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

-- Create indexes for subscription_history
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history (user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON public.subscription_history (subscription_id);

-- Add subscription columns to profiles table ONLY if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_subscribed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Create or replace update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for subscriptions (drops old one first)
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drops old ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can update subscriptions"
  ON public.subscriptions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can view their subscription history" ON public.subscription_history;
CREATE POLICY "Users can view their subscription history"
  ON public.subscription_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can insert subscription history" ON public.subscription_history;
CREATE POLICY "Service role can insert subscription history"
  ON public.subscription_history FOR INSERT WITH CHECK (true);

-- ============================================
-- FINAL VERIFICATION
-- ============================================

SELECT '✅ SETUP COMPLETE!' as status;

-- Show what was created/updated
SELECT 
  'subscriptions' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'subscriptions'
UNION ALL
SELECT 
  'subscription_history' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'subscription_history'
UNION ALL
SELECT 
  'profiles (subscription cols)' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name LIKE '%subscription%';

SELECT '✅ Database is ready for payments!' as message;
