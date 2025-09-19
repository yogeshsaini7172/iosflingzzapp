-- Fix the QCS table total_score column (it's currently a generated column)
ALTER TABLE public.qcs ALTER COLUMN total_score DROP EXPRESSION;
ALTER TABLE public.qcs ALTER COLUMN total_score SET DEFAULT NULL;

-- Remove any problematic triggers
DROP TRIGGER IF EXISTS tr_calculate_total_score ON public.qcs;
DROP TRIGGER IF EXISTS tr_sync_qcs_to_profile ON public.qcs;
DROP FUNCTION IF EXISTS calculate_total_score();

-- Create a simple trigger for QCS sync to profiles
CREATE OR REPLACE FUNCTION public.sync_qcs_to_profile_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Update profiles.total_qcs when QCS is updated
    UPDATE profiles 
    SET total_qcs = NEW.total_score,
        updated_at = NOW()
    WHERE user_id = NEW.user_id OR firebase_uid = NEW.user_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_sync_qcs_to_profile_simple
    AFTER INSERT OR UPDATE ON public.qcs
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_qcs_to_profile_simple();