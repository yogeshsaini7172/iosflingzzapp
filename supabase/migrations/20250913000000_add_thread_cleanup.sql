-- Step 1: Ensure the pg_cron extension is enabled.
-- This is a necessary prerequisite for scheduling jobs.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage permissions to the postgres role.
GRANT USAGE ON SCHEMA cron TO postgres;

-- Step 2: Create the function to delete old threads.
-- This function will be called by the cron job.
CREATE OR REPLACE FUNCTION public.cleanup_expired_threads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This command deletes all records from the 'threads' table
  -- where the creation timestamp is more than 24 hours in the past.
  DELETE FROM public.threads
  WHERE created_at < (NOW() - INTERVAL '24 hours');
END;
$$;

-- Step 3: Unschedule any previous cleanup jobs to avoid duplicates.
-- This ensures that if you run this script again, you won't have multiple jobs running.
SELECT cron.unschedule('daily-thread-cleanup');

-- Step 4: Schedule the new cleanup job.
-- This tells pg_cron to run the specified function daily at midnight UTC.
-- The '0 0 * * *' is a cron expression for: "at minute 0 of hour 0 (midnight) of every day-of-month of every month of every day-of-week".
SELECT
  cron.schedule(
    'daily-thread-cleanup', -- The unique name for our job
    '0 0 * * *',            -- The schedule: once a day at midnight UTC
    $$
    SELECT public.cleanup_expired_threads();
    $$
  );