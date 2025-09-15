-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user (required for Supabase)
GRANT USAGE ON SCHEMA cron TO postgres;