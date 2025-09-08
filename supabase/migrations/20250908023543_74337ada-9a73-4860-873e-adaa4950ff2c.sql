-- Relax RLS policies for service functions
-- Update partner_preferences to allow service role access
DROP POLICY IF EXISTS "Users can manage their own preferences - permissive" ON public.partner_preferences;

CREATE POLICY "Users can manage their own preferences" 
ON public.partner_preferences 
FOR ALL 
USING (
  -- Allow if user is authenticated and matches user_id
  (auth.uid() IS NOT NULL AND (auth.uid())::text = user_id) OR 
  -- Allow service role (for edge functions)
  (auth.role() = 'service_role') OR
  -- Allow for unamed/demo users
  (auth.uid() IS NULL)
) 
WITH CHECK (
  -- Same conditions for inserts/updates
  (auth.uid() IS NOT NULL AND (auth.uid())::text = user_id) OR 
  (auth.role() = 'service_role') OR
  (auth.uid() IS NULL)
);

-- Update profiles table to allow service role access
CREATE POLICY "Service functions can manage profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');