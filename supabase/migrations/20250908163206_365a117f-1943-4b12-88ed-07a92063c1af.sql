-- Fix the create_match_and_chat function to handle read-only issues
DROP FUNCTION IF EXISTS public.create_match_and_chat(text, text, text);

CREATE OR REPLACE FUNCTION public.create_match_and_chat(p_actor_id text, p_a text, p_b text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
SET search_path = public
AS $$
DECLARE
  v_user1 text;
  v_user2 text;
  v_match_id uuid;
  v_created_match boolean := false;
  v_chat_room_id uuid;
  v_created_chat boolean := false;
BEGIN
  -- determine deterministic ordering
  IF p_a < p_b THEN
    v_user1 := p_a;
    v_user2 := p_b;
  ELSE
    v_user1 := p_b;
    v_user2 := p_a;
  END IF;

  -- Insert match if not exists
  INSERT INTO enhanced_matches(user1_id, user2_id, status, created_at)
  VALUES (v_user1, v_user2, 'matched', now())
  ON CONFLICT (user1_id, user2_id) DO NOTHING
  RETURNING id INTO v_match_id;

  IF v_match_id IS NOT NULL THEN
    v_created_match := true;
  ELSE
    -- row exists; fetch its id
    SELECT id INTO v_match_id FROM enhanced_matches WHERE user1_id = v_user1 AND user2_id = v_user2 LIMIT 1;
  END IF;

  -- Create chat room if not exists
  INSERT INTO chat_rooms(match_id, user1_id, user2_id, created_at)
  VALUES (v_match_id, v_user1, v_user2, now())
  ON CONFLICT (match_id) DO NOTHING
  RETURNING id INTO v_chat_room_id;

  IF v_chat_room_id IS NOT NULL THEN
    v_created_chat := true;
  ELSE
    SELECT id INTO v_chat_room_id FROM chat_rooms WHERE match_id = v_match_id LIMIT 1;
  END IF;

  -- Insert notifications for both users if not already present
  INSERT INTO notifications(user_id, type, title, message, data, created_at)
  VALUES (
    v_user1,
    'new_match',
    'It''s a Match! 🎉',
    'You have a new match — say hi!',
    jsonb_build_object('enhanced_match_id', v_match_id, 'chat_room_id', v_chat_room_id, 'other_user_id', v_user2),
    now()
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO notifications(user_id, type, title, message, data, created_at)
  VALUES (
    v_user2,
    'new_match',
    'It''s a Match! 🎉',
    'You have a new match — say hi!',
    jsonb_build_object('enhanced_match_id', v_match_id, 'chat_room_id', v_chat_room_id, 'other_user_id', v_user1),
    now()
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'match_id', v_match_id,
    'chat_room_id', v_chat_room_id,
    'created_match', v_created_match,
    'created_chat', v_created_chat
  );
EXCEPTION WHEN others THEN
  -- Log the error and still return something useful
  RAISE NOTICE 'Error in create_match_and_chat: %', SQLERRM;
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;