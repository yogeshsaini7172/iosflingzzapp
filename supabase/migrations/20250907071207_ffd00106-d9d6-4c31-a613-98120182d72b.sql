-- Allow anon updates to profiles for Firebase-auth demo mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Anon can update profiles (demo)'
  ) THEN
    CREATE POLICY "Anon can update profiles (demo)"
    ON public.profiles
    FOR UPDATE TO anon
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  END IF;
END $$;