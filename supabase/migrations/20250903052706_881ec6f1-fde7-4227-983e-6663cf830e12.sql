-- Add missing profile fields for comprehensive user profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS body_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skin_tone TEXT;  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS face_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS values TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mindset TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS field_of_study TEXT;

-- Update existing personality_type column to be more specific
-- (already exists but let's make sure it's properly set up)

-- Create enum types for better data consistency
CREATE TYPE IF NOT EXISTS body_type_enum AS ENUM ('slim', 'average', 'athletic', 'curvy', 'plus_size');
CREATE TYPE IF NOT EXISTS skin_tone_enum AS ENUM ('fair', 'wheatish', 'dusky', 'dark');
CREATE TYPE IF NOT EXISTS face_type_enum AS ENUM ('round', 'oval', 'square', 'heart', 'diamond');
CREATE TYPE IF NOT EXISTS values_enum AS ENUM ('traditional', 'modern', 'balanced');
CREATE TYPE IF NOT EXISTS mindset_enum AS ENUM ('optimistic', 'realistic', 'ambitious', 'easy_going');
CREATE TYPE IF NOT EXISTS personality_enum AS ENUM ('introvert', 'extrovert', 'ambivert');
CREATE TYPE IF NOT EXISTS year_of_study_enum AS ENUM ('1st_year', '2nd_year', '3rd_year', '4th_year', 'postgrad');

-- Update columns to use enum types for better validation
ALTER TABLE public.profiles ALTER COLUMN body_type TYPE body_type_enum USING body_type::body_type_enum;
ALTER TABLE public.profiles ALTER COLUMN skin_tone TYPE skin_tone_enum USING skin_tone::skin_tone_enum;
ALTER TABLE public.profiles ALTER COLUMN face_type TYPE face_type_enum USING face_type::face_type_enum;
ALTER TABLE public.profiles ALTER COLUMN values TYPE values_enum USING values::values_enum;
ALTER TABLE public.profiles ALTER COLUMN mindset TYPE mindset_enum USING mindset::mindset_enum;
ALTER TABLE public.profiles ALTER COLUMN personality_type TYPE personality_enum USING personality_type::personality_enum;