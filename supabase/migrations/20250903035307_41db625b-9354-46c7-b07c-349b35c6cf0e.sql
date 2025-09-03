-- Ensure trigger exists to create profile rows on new auth users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- Optional: create index for swipes table for performance
DO $$
BEGIN
  IF to_regclass('public.swipes_user_candidate_idx') IS NULL THEN
    CREATE INDEX swipes_user_candidate_idx ON public.swipes(user_id, candidate_id);
  END IF;
END $$;