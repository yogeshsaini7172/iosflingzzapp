-- Add firebase_uid column to profiles table for Firebase auth compatibility
ALTER TABLE profiles ADD COLUMN firebase_uid TEXT;

-- Create unique index on firebase_uid
CREATE UNIQUE INDEX idx_profiles_firebase_uid ON profiles(firebase_uid);

-- Update existing profiles to use user_id as firebase_uid (for migration)
UPDATE profiles SET firebase_uid = user_id WHERE firebase_uid IS NULL;

-- Create function to handle profile lookup by Firebase UID
CREATE OR REPLACE FUNCTION get_profile_by_firebase_uid(uid TEXT)
RETURNS TABLE(
  id uuid,
  user_id text,
  firebase_uid text,
  first_name text,
  last_name text,
  email text,
  bio text,
  profile_images text[],
  university text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.firebase_uid,
    p.first_name,
    p.last_name,
    p.email,
    p.bio,
    p.profile_images,
    p.university,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.firebase_uid = uid OR p.user_id = uid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_profile_by_firebase_uid(TEXT) TO authenticated;