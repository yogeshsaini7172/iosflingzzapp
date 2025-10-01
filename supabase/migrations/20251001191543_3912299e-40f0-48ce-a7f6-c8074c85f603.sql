-- Add profession_description field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profession_description TEXT;