-- Fix QCS table to allow manual total_score inserts
ALTER TABLE public.qcs ALTER COLUMN total_score DROP DEFAULT;
ALTER TABLE public.qcs ALTER COLUMN total_score SET DEFAULT NULL;

-- Remove the auto-calculation constraint that's blocking manual inserts
DROP TRIGGER IF EXISTS tr_calculate_total_score ON public.qcs;
DROP FUNCTION IF EXISTS calculate_total_score();

-- Recreate a simpler trigger that only calculates if total_score is NULL
CREATE OR REPLACE FUNCTION public.calculate_total_score_if_null()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Only auto-calculate if total_score is NULL
    IF NEW.total_score IS NULL THEN
        NEW.total_score = COALESCE(NEW.profile_score, 0) + 
                         COALESCE(NEW.college_tier, 0) + 
                         COALESCE(NEW.personality_depth, 0) + 
                         COALESCE(NEW.behavior_score, 0);
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_calculate_total_score_if_null
    BEFORE INSERT OR UPDATE ON public.qcs
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_total_score_if_null();