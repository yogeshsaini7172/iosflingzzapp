-- ============================================
-- CHECK SUBSCRIPTION_TIER COLUMN
-- Run this in Supabase SQL Editor
-- ============================================

-- Check 1: Does subscription_tier column exist in profiles table?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name = 'subscription_tier'
    ) 
    THEN '✅ subscription_tier column EXISTS in profiles table'
    ELSE '❌ subscription_tier column DOES NOT EXIST in profiles table'
  END as tier_column_status;

-- Check 2: Show subscription_tier column details
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'subscription_tier';

-- Check 3: Show all subscription-related columns in profiles
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND (
    column_name LIKE '%subscription%'
    OR column_name LIKE '%tier%'
    OR column_name LIKE '%plan%'
  )
ORDER BY column_name;

-- Check 4: Show sample data with subscription fields
SELECT 
  id,
  user_id,
  first_name,
  subscription_plan,
  subscription_tier,
  is_subscribed,
  subscription_started_at,
  subscription_expires_at
FROM public.profiles
WHERE user_id IS NOT NULL
LIMIT 5;

-- Check 5: Count profiles by subscription tier
SELECT 
  subscription_tier,
  COUNT(*) as count
FROM public.profiles
GROUP BY subscription_tier
ORDER BY subscription_tier;

-- ============================================
-- ALTERNATIVE: If column doesn't exist, run this to add it
-- ============================================

-- Uncomment and run this if subscription_tier is missing:
/*
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text;

-- Update existing subscriptions to set tier based on plan
UPDATE public.profiles
SET subscription_tier = 
  CASE 
    WHEN subscription_plan = 'basic_69' THEN 'basic'
    WHEN subscription_plan = 'standard_129' THEN 'standard'
    WHEN subscription_plan = 'premium_243' THEN 'premium'
    ELSE NULL
  END
WHERE subscription_plan IS NOT NULL 
  AND subscription_tier IS NULL;

-- Verify the update
SELECT subscription_plan, subscription_tier, COUNT(*) 
FROM public.profiles 
WHERE subscription_plan IS NOT NULL
GROUP BY subscription_plan, subscription_tier;
*/
