-- Add missing height preference columns to partner_preferences table
ALTER TABLE partner_preferences 
ADD COLUMN IF NOT EXISTS height_range_min integer DEFAULT 150,
ADD COLUMN IF NOT EXISTS height_range_max integer DEFAULT 200,
ADD COLUMN IF NOT EXISTS preferred_body_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_values text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_mindset text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_personality_traits text[] DEFAULT '{}';