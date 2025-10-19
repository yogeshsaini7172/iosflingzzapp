-- Add array fields for personality traits, values, and mindset
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS personality_traits TEXT[],
ADD COLUMN IF NOT EXISTS values_array TEXT[],
ADD COLUMN IF NOT EXISTS mindset_array TEXT[];

-- Update existing data to populate array fields from single values
UPDATE profiles 
SET 
  personality_traits = CASE 
    WHEN personality_type IS NOT NULL THEN ARRAY[personality_type] 
    ELSE NULL 
  END,
  values_array = CASE 
    WHEN values IS NOT NULL THEN ARRAY[values] 
    ELSE NULL 
  END,
  mindset_array = CASE 
    WHEN mindset IS NOT NULL THEN ARRAY[mindset] 
    ELSE NULL 
  END
WHERE personality_traits IS NULL OR values_array IS NULL OR mindset_array IS NULL;

-- Create indexes for better performance on array searches
CREATE INDEX IF NOT EXISTS idx_profiles_personality_traits ON profiles USING GIN(personality_traits);
CREATE INDEX IF NOT EXISTS idx_profiles_values_array ON profiles USING GIN(values_array);
CREATE INDEX IF NOT EXISTS idx_profiles_mindset_array ON profiles USING GIN(mindset_array);
