-- Clean up unused tables from the database
-- This migration removes tables that are not referenced anywhere in the codebase

-- Drop old/legacy tables that have been replaced
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.swipes CASCADE;

-- Drop test/development tables
DROP TABLE IF EXISTS public.test_credentials CASCADE;
DROP TABLE IF EXISTS public.test_users CASCADE;

-- Drop unused feature tables
DROP TABLE IF EXISTS public.admin_reports CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;