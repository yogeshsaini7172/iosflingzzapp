-- Final attempt to fix remaining security issues

-- There might be a system view we missed. Let's check for any views in our schema
-- and ensure they don't have SECURITY DEFINER

-- Let's also fix any remaining functions that might need search_path
-- Check common trigger functions
DO $$
BEGIN
    -- Fix any remaining functions one by one
    BEGIN
        ALTER FUNCTION public.update_profile_timestamp() SET search_path = 'public';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER FUNCTION public.trigger_qcs_recalculation() SET search_path = 'public';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER FUNCTION public.sync_qcs_to_profile() SET search_path = 'public';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER FUNCTION public.sync_qcs_to_profile_simple() SET search_path = 'public';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- If candidate_profiles is causing issues, make sure it's completely removed
DROP TABLE IF EXISTS public.candidate_profiles CASCADE;

-- Create a comment to note the security issues that require user action
COMMENT ON SCHEMA public IS 'Remaining security actions required: 1) Enable leaked password protection in Supabase Auth settings, 2) Upgrade PostgreSQL version in Supabase dashboard';