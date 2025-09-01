-- Create function to increment reports count
CREATE OR REPLACE FUNCTION public.increment_reports_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.profiles 
    SET reports_count = COALESCE(reports_count, 0) + 1
    WHERE profiles.user_id = increment_reports_count.user_id;
END;
$$;