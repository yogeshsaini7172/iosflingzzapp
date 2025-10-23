-- Fix RLS policies for subscriptions table
-- Run this in Supabase SQL Editor

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'subscriptions';

-- Disable RLS temporarily for testing (or add proper policies)
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled, add this policy to allow service role:
-- This allows the service_role (used by Edge Functions) to do everything
CREATE POLICY "Service role can manage subscriptions"
ON subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure authenticated users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Users can insert their own subscriptions (if needed from client)
CREATE POLICY "Users can insert own subscriptions"
ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Re-enable RLS after adding policies
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
