-- =====================================================
-- FIX: Ensure firebase_uid is set when new users sign up
-- =====================================================
-- This fixes the issue where profiles are created with user_id
-- but firebase_uid is NULL, causing admin checks to fail

-- Update the handle_new_user function to set firebase_uid
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    firebase_uid,     -- ✅ NOW SETTING THIS
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
    NEW.id,           -- ✅ Set firebase_uid = user_id for Firebase Auth compatibility
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

-- Backfill existing profiles where firebase_uid is NULL
-- This fixes profiles created before this migration
UPDATE profiles
SET firebase_uid = user_id
WHERE firebase_uid IS NULL OR firebase_uid = '';

-- Add a comment to document the fix
COMMENT ON FUNCTION public.handle_new_user IS 
'Creates a profile when a new user signs up. Sets both user_id and firebase_uid to ensure Firebase Auth compatibility and admin checks work correctly.';

-- Log the number of profiles that were fixed
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM profiles
  WHERE firebase_uid = user_id AND user_id IS NOT NULL;
  
  RAISE NOTICE 'Migration complete: % profiles now have firebase_uid set', fixed_count;
END $$;

