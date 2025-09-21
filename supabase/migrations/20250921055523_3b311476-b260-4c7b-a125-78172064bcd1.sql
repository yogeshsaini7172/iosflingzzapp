-- Migrate university data to profession field and update schema
-- First, update existing profiles where university is set but profession is null
UPDATE profiles 
SET profession = 'student'
WHERE university IS NOT NULL 
  AND university != '' 
  AND (profession IS NULL OR profession = '');

-- Make university field nullable since it's no longer actively used in UI
ALTER TABLE profiles 
ALTER COLUMN university DROP NOT NULL;

-- Set default for university to empty string for backwards compatibility
ALTER TABLE profiles 
ALTER COLUMN university SET DEFAULT '';

-- Ensure profession field has a reasonable default
ALTER TABLE profiles 
ALTER COLUMN profession SET DEFAULT 'student';

-- Add a comment to document the change
COMMENT ON COLUMN profiles.profession IS 'User profession - replaces university field in new UI, defaults to student';
COMMENT ON COLUMN profiles.university IS 'Legacy university field - kept for backwards compatibility, no longer actively used';