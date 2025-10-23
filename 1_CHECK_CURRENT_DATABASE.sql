-- ============================================
-- STEP 1: CHECK WHAT CURRENTLY EXISTS
-- Run this FIRST to see your current database state
-- ============================================

-- 1. Check all tables that exist
SELECT 
  '=== EXISTING TABLES ===' as info,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check ALL columns in profiles table
SELECT 
  '=== ALL PROFILES TABLE COLUMNS ===' as info,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if subscriptions table exists and its columns
SELECT 
  '=== SUBSCRIPTIONS TABLE COLUMNS ===' as info,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 4. Check if subscription_history table exists and its columns
SELECT 
  '=== SUBSCRIPTION_HISTORY TABLE COLUMNS ===' as info,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscription_history'
ORDER BY ordinal_position;

-- 5. Count existing data
SELECT 
  '=== DATA COUNTS ===' as info,
  'Total profiles' as table_name,
  COUNT(*) as row_count
FROM public.profiles
UNION ALL
SELECT 
  '=== DATA COUNTS ===' as info,
  'Profiles with user_id' as table_name,
  COUNT(*) as row_count
FROM public.profiles
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
  '=== DATA COUNTS ===' as info,
  'Subscriptions (if exists)' as table_name,
  COALESCE((SELECT COUNT(*) FROM public.subscriptions), 0) as row_count;

-- ============================================
-- COPY ALL RESULTS AND SEND THEM TO ME
-- I will then create the exact SQL you need
-- ============================================
