-- Fix chat room listing by creating a simpler approach

-- Create a view that simplifies chat room queries
CREATE OR REPLACE VIEW public.chat_rooms_with_details AS
SELECT 
  cr.id,
  cr.user1_id,
  cr.user2_id,
  cr.match_id,
  cr.created_at,
  cr.updated_at,
  cr.last_message,
  cr.last_message_time,
  -- Add user details if profiles exist, otherwise use placeholder
  COALESCE(p1.first_name, 'User') as user1_first_name,
  COALESCE(p1.last_name, '1') as user1_last_name,
  COALESCE(p2.first_name, 'User') as user2_first_name,
  COALESCE(p2.last_name, '2') as user2_last_name
FROM public.chat_rooms cr
LEFT JOIN public.profiles p1 ON p1.user_id::text = cr.user1_id
LEFT JOIN public.profiles p2 ON p2.user_id::text = cr.user2_id;

-- Grant access to the view
GRANT SELECT ON public.chat_rooms_with_details TO authenticated;
GRANT SELECT ON public.chat_rooms_with_details TO anon;

-- Update the get_user_chat_rooms function to be more robust
CREATE OR REPLACE FUNCTION get_user_chat_rooms(p_user_id TEXT)
RETURNS TABLE(
  id UUID,
  user1_id TEXT,
  user2_id TEXT,
  match_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  other_user_id TEXT,
  other_user_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.user1_id,
    cr.user2_id,
    cr.match_id,
    cr.created_at,
    cr.updated_at,
    cr.last_message,
    cr.last_message_time,
    CASE 
      WHEN cr.user1_id = p_user_id THEN cr.user2_id
      ELSE cr.user1_id
    END as other_user_id,
    CASE 
      WHEN cr.user1_id = p_user_id THEN COALESCE(cr.user2_first_name || ' ' || cr.user2_last_name, 'Unknown User')
      ELSE COALESCE(cr.user1_first_name || ' ' || cr.user1_last_name, 'Unknown User')
    END as other_user_name
  FROM public.chat_rooms_with_details cr
  WHERE cr.user1_id = p_user_id OR cr.user2_id = p_user_id
  ORDER BY cr.updated_at DESC;
END;
$$;

-- Create a simple function to get messages for a chat room
CREATE OR REPLACE FUNCTION get_chat_messages(p_chat_room_id UUID)
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
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.chat_room_id,
    cm.sender_id,
    cm.message_text,
    cm.created_at
  FROM public.chat_messages_enhanced cm
  WHERE cm.chat_room_id = p_chat_room_id
  ORDER BY cm.created_at ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_chat_rooms(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_chat_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_messages(UUID) TO anon;

-- Test the functions with your actual user ID
-- Replace 'CnrLrwekbfQH6bLs68TGhFUUzwP2' with the user ID you're testing with
-- SELECT * FROM get_user_chat_rooms('CnrLrwekbfQH6bLs68TGhFUUzwP2');

-- Add comments
COMMENT ON VIEW public.chat_rooms_with_details IS 'Chat rooms with user profile details';
COMMENT ON FUNCTION get_user_chat_rooms(TEXT) IS 'Gets chat rooms for a user with other user details';
COMMENT ON FUNCTION get_chat_messages(UUID) IS 'Gets all messages for a specific chat room';
