-- Update chat-management function directly in SQL
-- This adds the missing 'create_room' action

-- First, let's create a simple test chat room manually
-- Insert a test chat room with hardcoded UUIDs (you can replace with actual user IDs)
INSERT INTO public.chat_rooms (id, user1_id, user2_id, created_at, updated_at, last_message, last_message_time)
VALUES (
  gen_random_uuid(),
  'test-user-1',  -- Replace with actual Firebase UID
  'test-user-2',  -- Replace with actual Firebase UID
  now(),
  now(),
  'Welcome to the chat!',
  now()
) ON CONFLICT DO NOTHING;

-- Insert another test chat room
INSERT INTO public.chat_rooms (id, user1_id, user2_id, created_at, updated_at, last_message, last_message_time)
VALUES (
  gen_random_uuid(),
  'test-user-1',  -- Replace with actual Firebase UID
  'test-user-3',  -- Replace with actual Firebase UID
  now(),
  now(),
  'Hello there!',
  now()
) ON CONFLICT DO NOTHING;

-- Add some test messages
INSERT INTO public.chat_messages_enhanced (chat_room_id, sender_id, message_text, created_at)
SELECT 
  id,
  user1_id,
  'Hello! This is a test message from user 1.',
  now() - interval '2 hours'
FROM public.chat_rooms 
WHERE user1_id = 'test-user-1' AND user2_id = 'test-user-2'
LIMIT 1;

INSERT INTO public.chat_messages_enhanced (chat_room_id, sender_id, message_text, created_at)
SELECT 
  id,
  user2_id,
  'Hi! Nice to meet you. This is user 2 responding.',
  now() - interval '1 hour'
FROM public.chat_rooms 
WHERE user1_id = 'test-user-1' AND user2_id = 'test-user-2'
LIMIT 1;

-- Create a simple stored procedure to handle chat room creation
-- This can be called directly from your app if needed
CREATE OR REPLACE FUNCTION create_chat_room(
  p_user1_id TEXT,
  p_user2_id TEXT,
  p_match_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  user1_id TEXT,
  user2_id TEXT,
  match_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message TEXT,
  last_message_time TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_room_id UUID;
  new_room_id UUID;
BEGIN
  -- Check if room already exists (either direction)
  SELECT cr.id INTO existing_room_id
  FROM public.chat_rooms cr
  WHERE (cr.user1_id = p_user1_id AND cr.user2_id = p_user2_id)
     OR (cr.user1_id = p_user2_id AND cr.user2_id = p_user1_id)
  LIMIT 1;
  
  IF existing_room_id IS NOT NULL THEN
    -- Return existing room
    RETURN QUERY
    SELECT cr.id, cr.user1_id, cr.user2_id, cr.match_id, cr.created_at, cr.updated_at, cr.last_message, cr.last_message_time
    FROM public.chat_rooms cr
    WHERE cr.id = existing_room_id;
  ELSE
    -- Create new room
    INSERT INTO public.chat_rooms (user1_id, user2_id, match_id, created_at, updated_at)
    VALUES (p_user1_id, p_user2_id, p_match_id, now(), now())
    RETURNING public.chat_rooms.id INTO new_room_id;
    
    -- Return new room
    RETURN QUERY
    SELECT cr.id, cr.user1_id, cr.user2_id, cr.match_id, cr.created_at, cr.updated_at, cr.last_message, cr.last_message_time
    FROM public.chat_rooms cr
    WHERE cr.id = new_room_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_chat_room(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_chat_room(TEXT, TEXT, UUID) TO anon;

-- Create a function to list chat rooms for a user
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
  other_user_id TEXT
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
    END as other_user_id
  FROM public.chat_rooms cr
  WHERE cr.user1_id = p_user_id OR cr.user2_id = p_user_id
  ORDER BY cr.updated_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_chat_rooms(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms(TEXT) TO anon;

-- Add helpful comments
COMMENT ON FUNCTION create_chat_room(TEXT, TEXT, UUID) IS 'Creates or returns existing chat room between two users';
COMMENT ON FUNCTION get_user_chat_rooms(TEXT) IS 'Gets all chat rooms for a specific user';
