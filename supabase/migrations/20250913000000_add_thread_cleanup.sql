-- Add function to clean up old threads
CREATE OR REPLACE FUNCTION public.cleanup_old_threads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete threads older than 24 hours
  DELETE FROM public.threads
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create a scheduled job to run every hour
DO $$
BEGIN
  SELECT cron.schedule(
    'cleanup-old-threads',  -- job name
    '0 * * * *',           -- run every hour (cron expression)
    'SELECT public.cleanup_old_threads();'
  );
END
$$;