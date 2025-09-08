-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS personality_traits TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS values_array TEXT[] DEFAULT '{}';