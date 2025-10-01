-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily swipe reset to run at midnight (00:00) UTC every day
SELECT cron.schedule(
  'daily-swipe-reset',
  '0 0 * * *', -- Run at 00:00 (midnight) UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/daily-swipe-reset',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Add comment to track this cron job
COMMENT ON EXTENSION pg_cron IS 'Cron job scheduler for daily swipe reset at midnight UTC';
