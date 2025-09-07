-- Fix security issue: Set proper search path for commonly used functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    email,
    date_of_birth,
    gender,
    university,
    verification_status,
    is_active,
    last_active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.email, ''), -- handle phone-only signups where email is NULL
    CURRENT_DATE,
    'prefer_not_to_say'::gender,
    COALESCE(NEW.raw_user_meta_data->>'university', ''),
    'pending',
    true,
    now()
  );
  RETURN NEW;
END;
$$;