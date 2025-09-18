-- Fixed thread cleanup migration without pg_cron dependency
-- This replaces the problematic cron-based cleanup

-- Step 1: Create or replace the function to delete old threads (manual trigger only)
CREATE OR REPLACE FUNCTION public.cleanup_expired_threads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete threads older than 24 hours (instead of 1 minute for production)
  DELETE FROM public.threads
  WHERE created_at < (NOW() - INTERVAL '24 hours');
  
  -- Log the cleanup
  RAISE NOTICE 'Executed thread cleanup at %', NOW();
END;
$$;

-- Step 2: Remove any existing cron jobs (this might fail if pg_cron is not available)
DO $$
BEGIN
    -- Try to unschedule, but don't fail if cron doesn't exist
    BEGIN
        PERFORM cron.unschedule('daily-thread-cleanup');
        PERFORM cron.unschedule('every-minute-thread-cleanup');
        PERFORM cron.unschedule('test-thread-cleanup');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not unschedule cron jobs (pg_cron may not be available): %', SQLERRM;
    END;
END $$;

-- Step 3: Comment out automatic scheduling for now
-- Manual cleanup can be triggered by calling: SELECT public.cleanup_expired_threads();

-- Log that manual cleanup is available
SELECT 'Thread cleanup function created. Call SELECT public.cleanup_expired_threads(); to run manually.' AS message;