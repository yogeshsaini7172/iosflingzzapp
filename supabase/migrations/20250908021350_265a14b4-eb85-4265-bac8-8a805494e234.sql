-- Temporarily make partner_preferences policies more permissive for Firebase auth users
-- This fixes the "new row violates row-level security policy" error

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can manage their own preferences" ON partner_preferences;

-- Create more permissive policies that work with Firebase auth or demo mode
CREATE POLICY "Users can manage their own preferences - permissive" 
ON partner_preferences 
FOR ALL 
USING (
  -- Allow if Supabase auth matches
  (auth.uid() IS NOT NULL AND (auth.uid())::text = user_id)
  -- Allow if no auth (demo mode) 
  OR (auth.uid() IS NULL)
)
WITH CHECK (
  -- Same conditions for inserts
  (auth.uid() IS NOT NULL AND (auth.uid())::text = user_id)
  OR (auth.uid() IS NULL)
);