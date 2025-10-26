-- Add new lifestyle fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS exercise_habits TEXT,
ADD COLUMN IF NOT EXISTS drinking_habits TEXT,
ADD COLUMN IF NOT EXISTS smoking_habits TEXT,
ADD COLUMN IF NOT EXISTS diet_preference TEXT,
ADD COLUMN IF NOT EXISTS pet_preference TEXT,
ADD COLUMN IF NOT EXISTS children_plans TEXT;

-- Add new preference fields to partner_preferences table
ALTER TABLE public.partner_preferences
ADD COLUMN IF NOT EXISTS preferred_exercise TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_drinking TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_smoking TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_diet TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_pets TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_children TEXT[] DEFAULT '{}';