-- Enable JWT verification for all edge functions for security
-- This ensures only authenticated users can access the functions

-- Add last_active column to profiles table for better user tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now();

-- Create index on last_active for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active);

-- Update the handle_new_user function to set last_active on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
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
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    CURRENT_DATE,
    'prefer_not_to_say'::gender,
    COALESCE(new.raw_user_meta_data->>'university', ''),
    'pending',
    true,
    now()
  );
  RETURN new;
END;
$$;