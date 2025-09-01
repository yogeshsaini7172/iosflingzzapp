-- Add missing columns to profiles table for CampusConnect functionality
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT false;