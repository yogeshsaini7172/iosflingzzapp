-- Create trigger to sync QCS updates into profiles.total_qcs
DO $$ BEGIN
  -- Create trigger only if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sync_qcs_to_profile'
  ) THEN
    CREATE TRIGGER tr_sync_qcs_to_profile
    AFTER INSERT OR UPDATE ON public.qcs
    FOR EACH ROW EXECUTE FUNCTION public.sync_qcs_to_profile();
  END IF;
END $$;