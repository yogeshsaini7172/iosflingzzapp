-- Create a function to send messages that bypasses RLS
CREATE OR REPLACE FUNCTION send_chat_message(
  p_chat_room_id UUID,
  p_sender_id TEXT,
  p_message_text TEXT
)
RETURNS TABLE(
  id UUID,
  chat_room_id UUID,
  sender_id TEXT,
  message_text TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_message_id UUID;
  new_created_at TIMESTAMPTZ;
BEGIN
  -- Insert the message
  INSERT INTO public.chat_messages_enhanced (chat_room_id, sender_id, message_text, created_at)
  VALUES (p_chat_room_id, p_sender_id, p_message_text, now())
  RETURNING public.chat_messages_enhanced.id, public.chat_messages_enhanced.created_at 
  INTO new_message_id, new_created_at;
  
  -- Update the chat room with last message info
  UPDATE public.chat_rooms 
  SET 
    last_message = p_message_text,
    last_message_time = new_created_at,
    updated_at = new_created_at
  WHERE public.chat_rooms.id = p_chat_room_id;
  
  -- Return the new message
  RETURN QUERY
  SELECT 
    new_message_id,
    p_chat_room_id,
    p_sender_id,
    p_message_text,
    new_created_at;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_chat_message(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_chat_message(UUID, TEXT, TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION send_chat_message(UUID, TEXT, TEXT) IS 'Sends a chat message and updates the chat room with SECURITY DEFINER to bypass RLS';
