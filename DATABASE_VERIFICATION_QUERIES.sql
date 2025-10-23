-- ============================================
-- DATABASE VERIFICATION SCRIPT
-- Run these queries and send me the results
-- ============================================

-- QUERY 1: Check if subscriptions table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions'
  ) as subscriptions_table_exists;

-- QUERY 2: Check subscriptions table structure (if it exists)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- QUERY 3: Check profiles table for subscription-related columns
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND (column_name LIKE '%subscription%' OR column_name LIKE '%subscribed%')
ORDER BY ordinal_position;

-- QUERY 4: Check if subscription_history table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_history'
  ) as subscription_history_table_exists;

-- QUERY 5: Count current subscriptions (if table exists)
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_subscriptions
FROM public.subscriptions;

-- QUERY 6: Get a sample user ID from profiles (we'll use this for testing)
SELECT 
  id as profile_id,
  user_id as firebase_uid,
  first_name,
  last_name,
  email,
  subscription_tier,
  is_subscribed
FROM public.profiles
WHERE user_id IS NOT NULL
LIMIT 5;

-- QUERY 7: Check indexes on subscriptions table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'subscriptions'
ORDER BY indexname;

-- QUERY 8: Check RLS policies on subscriptions table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions';

-- ============================================
-- SEND ME THE RESULTS OF ALL THESE QUERIES
-- ============================================
/*
Please run each query and send me:
1. Whether subscriptions table exists (Query 1)
2. The structure of subscriptions table (Query 2)
3. Subscription columns in profiles table (Query 3)
4. Whether subscription_history exists (Query 4)
5. Current subscription count (Query 5)
6. Sample user IDs (Query 6) - we'll use one for testing
7. Any errors you see

Then I'll provide you with the exact commands to:
- Create/update missing tables
- Insert a test subscription
- Verify the payment flow works
*/
