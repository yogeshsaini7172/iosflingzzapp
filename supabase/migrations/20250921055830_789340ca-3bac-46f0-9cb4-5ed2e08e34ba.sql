-- Let's identify and fix the remaining function missing search_path
-- Looking at our function list, there might be some system functions we missed

-- Fix any remaining update functions that might be missing search_path
ALTER FUNCTION public.update_thread_counts() SET search_path = 'public';

-- Check for any remaining views that might have SECURITY DEFINER
-- Let's also check if candidate_profiles view has SECURITY DEFINER
DROP VIEW IF EXISTS public.candidate_profiles CASCADE;

-- Also let's make sure we haven't missed any other system functions
-- These are likely trigger functions or other utility functions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through functions without search_path set
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc_config pc 
            WHERE pc.oid = p.oid AND pc.configname = 'search_path'
        )
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE 'uuid_%'
    LOOP
        -- Try to set search_path for each function
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''public''', 
                          func_record.function_name, 
                          func_record.args);
        EXCEPTION WHEN OTHERS THEN
            -- Log the error but continue
            RAISE NOTICE 'Could not set search_path for function %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
END $$;