-- Create per-user AI request failures table for circuit breaker
CREATE TABLE IF NOT EXISTS ai_request_failures (
  user_id text PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  first_failure_at timestamptz,
  last_failure_at timestamptz,
  next_allowed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies for ai_request_failures
ALTER TABLE ai_request_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI failure records" ON ai_request_failures
  FOR SELECT USING (user_id = (auth.uid())::text);

CREATE POLICY "System can manage AI failure records" ON ai_request_failures
  FOR ALL USING (auth.role() = 'service_role'::text);

-- Helper function to increment failures and compute exponential backoff
CREATE OR REPLACE FUNCTION increment_failure_count(p_user_id text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rec ai_request_failures%ROWTYPE;
  new_failures integer;
  wait_seconds integer;
  base_seconds integer := 60; -- base 1 minute
BEGIN
  SELECT * INTO rec FROM ai_request_failures WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO ai_request_failures(user_id, failures, first_failure_at, last_failure_at, next_allowed_at)
    VALUES (p_user_id, 1, now(), now(), now() + interval '1 minute');
    RETURN 1;
  ELSE
    new_failures := rec.failures + 1;
    wait_seconds := LEAST(base_seconds * (2 ^ (new_failures - 1)), 3600); -- cap at 1 hour
    UPDATE ai_request_failures
    SET failures = new_failures,
        last_failure_at = now(),
        next_allowed_at = now() + (wait_seconds || ' seconds')::interval,
        updated_at = now()
    WHERE user_id = p_user_id;
    RETURN new_failures;
  END IF;
END;
$$;

-- Function to reset failures on success
CREATE OR REPLACE FUNCTION reset_ai_failures(p_user_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE ai_request_failures
  SET failures = 0,
      next_allowed_at = null,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Add new columns to qcs table for better tracking
ALTER TABLE qcs ADD COLUMN IF NOT EXISTS total_score_float numeric;
ALTER TABLE qcs ADD COLUMN IF NOT EXISTS logic_score integer;
ALTER TABLE qcs ADD COLUMN IF NOT EXISTS ai_score integer;
ALTER TABLE qcs ADD COLUMN IF NOT EXISTS ai_meta jsonb;
ALTER TABLE qcs ADD COLUMN IF NOT EXISTS per_category jsonb;

-- Ensure total_score is integer
ALTER TABLE qcs ALTER COLUMN total_score TYPE integer USING COALESCE(total_score, 0)::integer;

-- Add qcs_synced_at to profiles for tracking sync status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS qcs_synced_at timestamptz;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_request_failures_next_allowed ON ai_request_failures(next_allowed_at) WHERE next_allowed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_qcs_synced ON profiles(qcs_synced_at);