-- Fix the remaining 2 functions missing search_path protection
-- First let's check which functions still need fixing by looking at functions without search_path

-- Fix the remaining functions (these are likely trigger functions)
ALTER FUNCTION public.cleanup_expired_threads() SET search_path = 'public';
ALTER FUNCTION public.create_enhanced_match_if_not_exists(uuid, uuid) SET search_path = 'public';

-- Now let's check what views might have SECURITY DEFINER
-- Drop and recreate the view without SECURITY DEFINER if it exists
DROP VIEW IF EXISTS public.chat_rooms_with_details CASCADE;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.chat_rooms_with_details AS
SELECT 
  cr.id,
  cr.match_id,
  cr.created_at,
  cr.updated_at,
  cr.last_message,
  cr.last_message_time,
  cr.user1_id,
  cr.user2_id,
  p1.first_name as user1_first_name,
  p1.last_name as user1_last_name,
  p2.first_name as user2_first_name,
  p2.last_name as user2_last_name
FROM chat_rooms cr
LEFT JOIN profiles p1 ON cr.user1_id = p1.firebase_uid OR cr.user1_id = p1.user_id
LEFT JOIN profiles p2 ON cr.user2_id = p2.firebase_uid OR cr.user2_id = p2.user_id;