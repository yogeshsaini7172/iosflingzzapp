-- Fix the RETURNING clause syntax error in rpc_accept_chat_request
CREATE OR REPLACE FUNCTION public.rpc_accept_chat_request(p_chat_request_id uuid, p_recipient_id text)
 RETURNS TABLE(match_id uuid, chat_room_id uuid, created_match boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  cr record;
  u1 text;
  u2 text;
  inserted_match_id uuid;
  inserted_chat_id uuid;
  v_created_match boolean := false;
BEGIN
  -- Lock the chat request row FOR UPDATE to avoid races
  SELECT * INTO cr FROM chat_requests WHERE id = p_chat_request_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'chat_request not found';
  END IF;

  IF cr.status <> 'pending' THEN
    RAISE EXCEPTION 'chat_request not pending (current status: %)', cr.status;
  END IF;

  IF cr.recipient_id <> p_recipient_id THEN
    RAISE EXCEPTION 'not authorized to accept this request';
  END IF;

  -- Canonicalize user pair (alphabetical order)
  u1 := LEAST(cr.sender_id, cr.recipient_id);
  u2 := GREATEST(cr.sender_id, cr.recipient_id);

  -- Try to insert match atomically; ignore if exists
  INSERT INTO enhanced_matches (user1_id, user2_id, status, created_at)
    VALUES (u1, u2, 'matched', now())
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING enhanced_matches.id INTO inserted_match_id;

  IF inserted_match_id IS NOT NULL THEN
    v_created_match := true;
  ELSE
    -- Match existed: fetch its id
    SELECT em.id INTO inserted_match_id
      FROM enhanced_matches em
      WHERE em.user1_id = u1 AND em.user2_id = u2
      LIMIT 1;
  END IF;

  -- Create chat_room if not exists
  INSERT INTO chat_rooms (match_id, user1_id, user2_id, created_at)
    VALUES (inserted_match_id, u1, u2, now())
    ON CONFLICT (match_id) DO NOTHING
    RETURNING chat_rooms.id INTO inserted_chat_id;

  IF inserted_chat_id IS NULL THEN
    SELECT chat_rooms.id INTO inserted_chat_id FROM chat_rooms WHERE chat_rooms.match_id = inserted_match_id LIMIT 1;
  END IF;

  -- Update chat request status
  UPDATE chat_requests 
  SET status = 'accepted', updated_at = now() 
  WHERE id = p_chat_request_id;

  -- Create notification for sender (atomic within this transaction)
  INSERT INTO notifications(user_id, type, title, message, data, created_at)
    VALUES (
      cr.sender_id, 
      'chat_request_accepted',
      'Chat Request Accepted! 🎉',
      'Your chat request was accepted. Start chatting now!',
      jsonb_build_object(
        'enhanced_match_id', inserted_match_id, 
        'chat_room_id', inserted_chat_id, 
        'other_user_id', cr.recipient_id
      ),
      now()
    );

  RETURN QUERY SELECT inserted_match_id, inserted_chat_id, v_created_match;
END;
$function$