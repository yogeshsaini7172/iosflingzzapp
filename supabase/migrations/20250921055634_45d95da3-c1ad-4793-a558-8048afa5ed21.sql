-- Fix remaining functions missing search_path protection

ALTER FUNCTION public.get_chat_messages(uuid) SET search_path = 'public';
ALTER FUNCTION public.create_thread_as_user(text, text) SET search_path = 'public';
ALTER FUNCTION public.create_thread_reply_as_user(uuid, text, text) SET search_path = 'public';
ALTER FUNCTION public.rpc_get_feed_for_user(text, integer) SET search_path = 'public';
ALTER FUNCTION public.reset_daily_limits() SET search_path = 'public';
ALTER FUNCTION public.create_like_notification() SET search_path = 'public';
ALTER FUNCTION public.update_preferences_transaction(text, jsonb, jsonb) SET search_path = 'public';
ALTER FUNCTION public.create_match_and_chat(text, text, text) SET search_path = 'public';
ALTER FUNCTION public.set_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_chat_room_timestamp() SET search_path = 'public';