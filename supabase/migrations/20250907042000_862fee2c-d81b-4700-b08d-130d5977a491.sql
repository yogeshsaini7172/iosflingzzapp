-- Fix the security issue with function search path
CREATE OR REPLACE FUNCTION public.update_profile_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;