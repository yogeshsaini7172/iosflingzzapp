-- Fix security issues by adding search_path protection to functions
-- that don't currently have it set

-- Fix functions missing search_path protection
ALTER FUNCTION public.calculate_compatibility(jsonb, jsonb) SET search_path = 'public';
ALTER FUNCTION public.calculate_profile_completion(jsonb) SET search_path = 'public';
ALTER FUNCTION public.cleanup_expired_ghosts() SET search_path = 'public';
ALTER FUNCTION public.create_chat_room(text, text, uuid) SET search_path = 'public';
ALTER FUNCTION public.enhanced_matches_enforce_order() SET search_path = 'public';
ALTER FUNCTION public.get_profile_by_firebase_uid(text) SET search_path = 'public';
ALTER FUNCTION public.get_user_chat_rooms(text) SET search_path = 'public';
ALTER FUNCTION public.increment_failure_count(text) SET search_path = 'public';
ALTER FUNCTION public.receiver_id_from_room(text) SET search_path = 'public';
ALTER FUNCTION public.reset_ai_failures(text) SET search_path = 'public';
ALTER FUNCTION public.rpc_accept_chat_request(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.send_chat_message(uuid, text, text) SET search_path = 'public';
ALTER FUNCTION public.sync_message_to_enhanced() SET search_path = 'public';