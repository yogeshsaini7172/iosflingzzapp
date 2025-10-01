-- Add preferred_professions column to partner_preferences table
ALTER TABLE partner_preferences 
ADD COLUMN IF NOT EXISTS preferred_professions text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN partner_preferences.preferred_professions IS 'Array of preferred professions for partner matching';