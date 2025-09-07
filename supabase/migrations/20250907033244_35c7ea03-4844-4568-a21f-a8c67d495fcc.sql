-- Fix security issue: Set proper search path for update_chat_room_timestamp function
CREATE OR REPLACE FUNCTION public.update_chat_room_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_rooms 
  SET updated_at = now() 
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$$;