-- Add missing preference fields to partner_preferences table
ALTER TABLE public.partner_preferences 
ADD COLUMN IF NOT EXISTS preferred_skin_tone text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_face_type text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_love_language text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_lifestyle text[] DEFAULT '{}';