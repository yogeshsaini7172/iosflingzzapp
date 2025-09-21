-- Create the missing record_enhanced_swipe function
CREATE OR REPLACE FUNCTION public.record_enhanced_swipe(
  p_user_id text,
  p_target_user_id text,
  p_direction text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_match boolean := false;
  v_match_id uuid;
  v_chat_room_id uuid;
  v_user1 text;
  v_user2 text;
BEGIN
  -- Insert the swipe record
  INSERT INTO enhanced_swipes (user_id, target_user_id, direction, created_at)
  VALUES (p_user_id, p_target_user_id, p_direction, now());
  
  -- If this is a right swipe (like), check for mutual match
  IF p_direction = 'right' THEN
    -- Check if the target user has also swiped right on this user
    IF EXISTS (
      SELECT 1 FROM enhanced_swipes 
      WHERE user_id = p_target_user_id 
      AND target_user_id = p_user_id 
      AND direction = 'right'
    ) THEN
      v_is_match := true;
      
      -- Determine canonical user order (alphabetically)
      IF p_user_id < p_target_user_id THEN
        v_user1 := p_user_id;
        v_user2 := p_target_user_id;
      ELSE
        v_user1 := p_target_user_id;
        v_user2 := p_user_id;
      END IF;
      
      -- Create enhanced match if it doesn't exist
      INSERT INTO enhanced_matches (user1_id, user2_id, status, created_at)
      VALUES (v_user1, v_user2, 'matched', now())
      ON CONFLICT (user1_id, user2_id) DO NOTHING
      RETURNING id INTO v_match_id;
      
      -- If match already existed, get its ID
      IF v_match_id IS NULL THEN
        SELECT id INTO v_match_id 
        FROM enhanced_matches 
        WHERE user1_id = v_user1 AND user2_id = v_user2;
      END IF;
      
      -- Create chat room if it doesn't exist
      INSERT INTO chat_rooms (match_id, user1_id, user2_id, created_at, updated_at)
      VALUES (v_match_id, v_user1, v_user2, now(), now())
      ON CONFLICT (match_id) DO NOTHING
      RETURNING id INTO v_chat_room_id;
      
      -- If chat room already existed, get its ID
      IF v_chat_room_id IS NULL THEN
        SELECT id INTO v_chat_room_id 
        FROM chat_rooms 
        WHERE match_id = v_match_id;
      END IF;
      
      -- Create notifications for both users
      INSERT INTO notifications (user_id, type, title, message, data, created_at)
      VALUES 
        (p_user_id, 'new_match', 'It''s a Match! 🎉', 'You have a new match!', 
         jsonb_build_object('match_id', v_match_id, 'chat_room_id', v_chat_room_id, 'other_user_id', p_target_user_id), now()),
        (p_target_user_id, 'new_match', 'It''s a Match! 🎉', 'You have a new match!', 
         jsonb_build_object('match_id', v_match_id, 'chat_room_id', v_chat_room_id, 'other_user_id', p_user_id), now())
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Return the result
  RETURN jsonb_build_object(
    'is_match', v_is_match,
    'match_id', v_match_id,
    'chat_room_id', v_chat_room_id
  );
END;
$$;