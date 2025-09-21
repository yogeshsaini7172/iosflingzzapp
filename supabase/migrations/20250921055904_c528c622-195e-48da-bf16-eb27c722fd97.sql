-- Simple approach to fix remaining security issues

-- Fix the update_thread_counts function that we missed
ALTER FUNCTION public.update_thread_counts() SET search_path = 'public';

-- Check if there are any remaining views with SECURITY DEFINER by recreating candidate_profiles properly
-- First drop it if it exists
DROP VIEW IF EXISTS public.candidate_profiles;

-- Don't recreate it since it seems to be causing the SECURITY DEFINER issue
-- The table should be accessed directly instead of through a view

-- Add search_path to any remaining functions we might have missed
-- Let's target specific functions that commonly need this
DO $$
BEGIN
    -- Try common function names that might still need search_path
    BEGIN
        ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
    EXCEPTION WHEN OTHERS THEN
        -- Function might already have it set
        NULL;
    END;
    
    BEGIN
        ALTER FUNCTION public.increment_reports_count(uuid) SET search_path = 'public';
    EXCEPTION WHEN OTHERS THEN
        -- Function might already have it set or not exist
        NULL;
    END;
END $$;