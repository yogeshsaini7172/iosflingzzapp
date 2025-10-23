-- ============================================
-- SAFE CHECK: What columns exist in profiles table
-- Run this to see your current structure
-- ============================================

SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- Check if subscriptions table exists
-- ============================================

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'subscriptions'
    ) 
    THEN '✅ subscriptions table EXISTS'
    ELSE '❌ subscriptions table MISSING'
  END as status;

-- ============================================
-- If subscriptions table exists, show its columns
-- ============================================

SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;
