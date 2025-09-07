-- Update RLS policy for user_interactions to work with demo setup
-- Since we're bypassing auth and using hardcoded user IDs, we need to allow insertions based on the user_id field

-- Drop the existing policy that relies on auth.uid()
DROP POLICY IF EXISTS "Users can create their own interactions" ON public.user_interactions;

-- Create a new policy that allows users to create interactions where they are the user_id
-- This works with both authenticated users and our demo setup
CREATE POLICY "Users can create their own interactions" 
ON public.user_interactions 
FOR INSERT 
WITH CHECK (
  -- Allow if authenticated and user matches
  (auth.uid() IS NOT NULL AND (auth.uid())::text = user_id) 
  OR 
  -- Allow for demo purposes when no auth (for testing)
  (auth.uid() IS NULL AND user_id IS NOT NULL)
);