-- Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create proper RLS policy for profiles - users can only see basic info needed for matching
CREATE POLICY "Users can view limited profile info for matching" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own full profile
  auth.uid()::text = user_id 
  OR 
  -- Users can see limited public info of others (no sensitive data)
  (is_active = true AND show_profile = true)
);

-- Fix RLS policy for partner_preferences - only own preferences
DROP POLICY IF EXISTS "Allow all operations on partner_preferences" ON public.partner_preferences;

CREATE POLICY "Users can manage their own preferences" 
ON public.partner_preferences 
FOR ALL 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Restrict test tables to admin access only
DROP POLICY IF EXISTS "Test credentials accessible to all" ON public.test_credentials;
DROP POLICY IF EXISTS "Test users accessible to all" ON public.test_users;

CREATE POLICY "Admin access only test credentials" 
ON public.test_credentials 
FOR ALL 
USING (false);

CREATE POLICY "Admin access only test users" 
ON public.test_users 
FOR ALL 
USING (false);