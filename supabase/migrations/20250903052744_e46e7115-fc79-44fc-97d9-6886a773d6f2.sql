-- Add missing profile fields for comprehensive user profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS body_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skin_tone TEXT;  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS face_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS values TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mindset TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS field_of_study TEXT;