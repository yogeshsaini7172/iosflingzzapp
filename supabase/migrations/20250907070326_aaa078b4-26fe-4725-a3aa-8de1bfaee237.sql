-- RLS adjustments for demo mode (no Supabase auth)
-- Partner preferences: allow anon insert/update/select when user_id is provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='partner_preferences' AND policyname='Anon can insert preferences (demo)'
  ) THEN
    CREATE POLICY "Anon can insert preferences (demo)"
    ON public.partner_preferences
    FOR INSERT TO anon
    WITH CHECK ((auth.uid() IS NULL) AND (user_id IS NOT NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='partner_preferences' AND policyname='Anon can update preferences (demo)'
  ) THEN
    CREATE POLICY "Anon can update preferences (demo)"
    ON public.partner_preferences
    FOR UPDATE TO anon
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='partner_preferences' AND policyname='Anon can select preferences (demo)'
  ) THEN
    CREATE POLICY "Anon can select preferences (demo)"
    ON public.partner_preferences
    FOR SELECT TO anon
    USING (auth.uid() IS NULL);
  END IF;
END $$;