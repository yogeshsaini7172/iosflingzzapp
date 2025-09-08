-- Add missing preference fields to partner_preferences table
ALTER TABLE public.partner_preferences 
ADD COLUMN IF NOT EXISTS preferred_skin_tone ARRAY DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_face_type ARRAY DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_love_language ARRAY DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_lifestyle ARRAY DEFAULT '{}';