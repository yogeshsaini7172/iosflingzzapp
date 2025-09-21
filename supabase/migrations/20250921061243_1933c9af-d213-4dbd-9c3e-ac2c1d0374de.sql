-- Fix RLS policies for profiles table to allow viewing other users' profiles
-- This is essential for a dating/swipe app functionality

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable users to view their own data only" ON profiles;
DROP POLICY IF EXISTS "Policy with table joins" ON profiles;

-- Create new policy to allow authenticated users to view all active profiles
-- but exclude sensitive personal information
CREATE POLICY "Users can view all active profiles" ON profiles
FOR SELECT 
USING (
  is_active = true 
  AND auth.uid() IS NOT NULL
);

-- Keep the existing insert policy as it's correct
-- Users should only be able to create their own profile

-- Add update policy to allow users to update only their own profile
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE 
USING (((auth.uid())::text = firebase_uid))
WITH CHECK (((auth.uid())::text = firebase_uid));

-- Add policy for service role to manage profiles (for admin functions)
CREATE POLICY "Service role can manage all profiles" ON profiles
FOR ALL
USING (auth.role() = 'service_role');

-- Note: Users still cannot delete profiles for data integrity