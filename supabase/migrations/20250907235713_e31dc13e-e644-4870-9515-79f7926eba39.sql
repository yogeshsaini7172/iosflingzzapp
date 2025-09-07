-- Fix security definer functions search paths
ALTER FUNCTION public.calculate_compatibility(jsonb, jsonb) SET search_path = 'public';
ALTER FUNCTION public.cleanup_expired_ghosts() SET search_path = 'public';  
ALTER FUNCTION public.calculate_profile_completion(jsonb) SET search_path = 'public';
ALTER FUNCTION public.increment_reports_count(uuid) SET search_path = 'public';
ALTER FUNCTION public.reset_daily_limits() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.update_thread_counts() SET search_path = 'public';
ALTER FUNCTION public.update_chat_room_timestamp() SET search_path = 'public';
ALTER FUNCTION public.update_profile_timestamp() SET search_path = 'public';
ALTER FUNCTION public.create_enhanced_match_if_not_exists(uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';