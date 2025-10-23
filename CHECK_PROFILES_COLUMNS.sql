-- ============================================
-- CHECK EXACT SUBSCRIPTION COLUMNS IN PROFILES
-- ============================================

SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND (
    column_name LIKE '%subscription%'
    OR column_name LIKE '%tier%'
    OR column_name LIKE '%plan%'
    OR column_name LIKE '%subscribed%'
  )
ORDER BY column_name;

-- ============================================
-- Show ALL columns in profiles table
-- ============================================

SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
