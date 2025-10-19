-- Add radius and state preferences for location-based matching

-- Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS match_radius_km integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS match_by_state boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS state text;

-- Create index for state-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state) WHERE state IS NOT NULL;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN profiles.match_radius_km IS 'Radius in kilometers for distance-based matching (default 50km)';
COMMENT ON COLUMN profiles.match_by_state IS 'If true, only match with users from same state';
COMMENT ON COLUMN profiles.state IS 'State/region for state-based matching';