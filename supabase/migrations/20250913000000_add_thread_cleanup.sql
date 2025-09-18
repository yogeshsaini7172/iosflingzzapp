-- Step 1: Ensure the pg_cron extension is enabled.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage permissions to the postgres role.
GRANT USAGE ON SCHEMA cron TO postgres;

-- Step 2: Create or replace the function to delete old threads.
-- This version deletes threads older than 1 minute for testing purposes.
CREATE OR REPLACE FUNCTION public.cleanup_expired_threads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete threads older than 1 minute
  DELETE FROM public.threads
  WHERE created_at < (NOW() - INTERVAL '1 minute');
  
  -- Log the cleanup for testing
  RAISE NOTICE 'Executed thread cleanup at %', NOW();
END;
$$;

-- Step 3: Unschedule any previous cleanup jobs to avoid duplicates.
SELECT cron.unschedule('daily-thread-cleanup');
SELECT cron.unschedule('every-minute-thread-cleanup');

-- Step 4: Schedule the cleanup job to run every minute for testing
-- DISABLED: pg_cron may not be available in all environments
-- Uncomment the following block if pg_cron is properly installed:

/*
SELECT
  cron.schedule(
    'test-thread-cleanup',
    '* * * * *',                   -- Run every minute
    $$
    SELECT public.cleanup_expired_threads();
    $$
  );
*/

-- Log the scheduling for testing
SELECT 'Thread cleanup function created (cron scheduling disabled to prevent errors)' AS message;