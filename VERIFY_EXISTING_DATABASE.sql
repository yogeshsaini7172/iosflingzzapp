-- ============================================
-- STEP 1: VERIFICATION ONLY - RUN THIS FIRST
-- Copy and paste this into Supabase SQL Editor
-- ============================================

-- Check 1: Does subscriptions table exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'subscriptions'
    ) 
    THEN '✅ subscriptions table EXISTS'
    ELSE '❌ subscriptions table DOES NOT EXIST - needs to be created'
  END as subscriptions_table_status;

-- Check 2: Does subscription_history table exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'subscription_history'
    ) 
    THEN '✅ subscription_history table EXISTS'
    ELSE '❌ subscription_history table DOES NOT EXIST - needs to be created'
  END as subscription_history_table_status;

-- Check 3: Show subscriptions table structure (if exists)
SELECT 
  '=== SUBSCRIPTIONS TABLE STRUCTURE ===' as section,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Check 4: Show subscription-related columns in profiles table
SELECT 
  '=== PROFILES TABLE - SUBSCRIPTION COLUMNS ===' as section,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND (
    column_name LIKE '%subscription%' 
    OR column_name LIKE '%subscribed%'
    OR column_name = 'plan_id'
  )
ORDER BY column_name;

-- Check 5: Count existing data
SELECT 
  '=== DATA CHECK ===' as section,
  'subscriptions' as table_name,
  COUNT(*) as row_count
FROM public.subscriptions
WHERE EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'subscriptions'
)
UNION ALL
SELECT 
  '=== DATA CHECK ===' as section,
  'profiles with subscription' as table_name,
  COUNT(*) as row_count
FROM public.profiles
WHERE subscription_plan IS NOT NULL OR is_subscribed = true;

-- Check 6: Show indexes on subscriptions table
SELECT 
  '=== SUBSCRIPTIONS INDEXES ===' as section,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'subscriptions'
ORDER BY indexname;

-- Check 7: Get a sample user for testing
SELECT 
  '=== SAMPLE USER FOR TESTING ===' as section,
  id as profile_id,
  user_id as firebase_uid,
  first_name,
  last_name,
  email,
  subscription_plan,
  subscription_tier,
  is_subscribed,
  subscription_started_at
FROM public.profiles
WHERE user_id IS NOT NULL
LIMIT 3;

-- ============================================
-- SEND ME THE RESULTS OF ALL QUERIES ABOVE
-- ============================================
