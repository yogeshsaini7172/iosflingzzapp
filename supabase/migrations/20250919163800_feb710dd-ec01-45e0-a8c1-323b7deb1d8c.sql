-- Ensure QCS -> Profiles sync happens automatically
-- 1) Create trigger on qcs to update profiles.total_qcs after inserts/updates
DROP TRIGGER IF EXISTS trg_sync_qcs_to_profile ON public.qcs;

CREATE TRIGGER trg_sync_qcs_to_profile
AFTER INSERT OR UPDATE ON public.qcs
FOR EACH ROW
EXECUTE FUNCTION public.sync_qcs_to_profile();

-- 2) One-time backfill: align profiles.total_qcs with qcs.total_score for existing rows
UPDATE public.profiles p
SET total_qcs = q.total_score,
    updated_at = now()
FROM public.qcs q
WHERE (p.user_id = q.user_id OR p.firebase_uid = q.user_id)
  AND COALESCE(p.total_qcs, -1) IS DISTINCT FROM q.total_score;