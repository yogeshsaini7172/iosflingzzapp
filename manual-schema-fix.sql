-- Manual Schema Fix for Firebase UID Compatibility
-- Run this in Supabase Dashboard > SQL Editor

-- Fix chat_rooms table
ALTER TABLE public.chat_rooms 
ALTER COLUMN user1_id TYPE text;

ALTER TABLE public.chat_rooms 
ALTER COLUMN user2_id TYPE text;

-- Fix enhanced_matches table  
ALTER TABLE public.enhanced_matches 
ALTER COLUMN user1_id TYPE text;

ALTER TABLE public.enhanced_matches 
ALTER COLUMN user2_id TYPE text;

-- Add helpful comments
COMMENT ON COLUMN public.chat_rooms.user1_id IS 'Firebase Auth UID (text format)';
COMMENT ON COLUMN public.chat_rooms.user2_id IS 'Firebase Auth UID (text format)';
COMMENT ON COLUMN public.enhanced_matches.user1_id IS 'Firebase Auth UID (text format)';
COMMENT ON COLUMN public.enhanced_matches.user2_id IS 'Firebase Auth UID (text format)';

-- Update RLS policies for chat_rooms
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can view their chat rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
);

-- Update RLS policies for enhanced_matches
DROP POLICY IF EXISTS "Users can view their enhanced matches" ON public.enhanced_matches;
CREATE POLICY "Users can view their enhanced matches" 
ON public.enhanced_matches 
FOR SELECT 
USING (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user1_id ON public.chat_rooms(user1_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user2_id ON public.chat_rooms(user2_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_matches_user1_id ON public.enhanced_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_matches_user2_id ON public.enhanced_matches(user2_id);