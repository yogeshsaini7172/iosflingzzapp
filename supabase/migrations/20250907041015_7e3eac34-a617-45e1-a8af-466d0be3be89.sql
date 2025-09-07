-- Add UPDATE policy for user_interactions to support upsert/update in demo setup
CREATE POLICY IF NOT EXISTS "Users can update their own interactions"
ON public.user_interactions
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND (auth.uid())::text = user_id)
  OR
  (auth.uid() IS NULL AND user_id IS NOT NULL)
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND (auth.uid())::text = user_id)
  OR
  (auth.uid() IS NULL AND user_id IS NOT NULL)
);

-- Ensure SELECT policy exists to view own interactions or as target
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.user_interactions;
CREATE POLICY "Users can view their own interactions"
ON public.user_interactions
FOR SELECT
USING (
  ((auth.uid())::text = user_id) OR ((auth.uid())::text = target_user_id) OR (auth.uid() IS NULL)
);
