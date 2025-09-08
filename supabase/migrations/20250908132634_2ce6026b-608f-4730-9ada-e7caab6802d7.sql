-- 1. Ensure ordering is deterministic: this function will do it for insert
-- 2. Create unique index to prevent duplicate match pairs
CREATE UNIQUE INDEX IF NOT EXISTS ux_enhanced_matches_pair
ON enhanced_matches (user1_id, user2_id);

-- 3. Create transactional stored procedure to atomically create match, chat room, notifications
--    returns JSON with match_id, chat_room_id and booleans created_* so callers know what happened
CREATE OR REPLACE FUNCTION public.create_match_and_chat(
  p_actor_id uuid,      -- the user who initiated the swipe that completed the match (optional)
  p_a uuid,             -- user A id
  p_b uuid              -- user B id
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_user1 uuid;
  v_user2 uuid;
  v_match_id uuid;
  v_created_match boolean := false;
  v_chat_room_id uuid;
  v_created_chat boolean := false;
  v_notification_count int;
BEGIN
  -- determine deterministic ordering
  IF p_a::text < p_b::text THEN
    v_user1 := p_a;
    v_user2 := p_b;
  ELSE
    v_user1 := p_b;
    v_user2 := p_a;
  END IF;

  -- Insert match if not exists (we assume enhanced_matches has columns user1_id, user2_id, status, user1_swiped, user2_swiped, created_at)
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

  -- Create chat room if not exists (assumes chat_rooms.match_id unique or match_id nullable)
  INSERT INTO chat_rooms(match_id, user1_id, user2_id, created_at)
  VALUES (v_match_id, v_user1, v_user2, now())
  ON CONFLICT (match_id) DO NOTHING
  RETURNING id INTO v_chat_room_id;

  IF v_chat_room_id IS NOT NULL THEN
    v_created_chat := true;
  ELSE
    SELECT id INTO v_chat_room_id FROM chat_rooms WHERE match_id = v_match_id LIMIT 1;
  END IF;

  -- Notifications: create for both users if missing for this match
  PERFORM 1 FROM notifications WHERE (user_id = v_user1 OR user_id = v_user2) AND (data->>'enhanced_match_id') = v_match_id::text LIMIT 1;
  -- Instead of doing nothing if any exists, we'll insert for each user individually if missing:
  SELECT COUNT(*) INTO v_notification_count
    FROM notifications
    WHERE (data->>'enhanced_match_id') = v_match_id::text;

  -- Insert for both users if not already present (use left join pattern)
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = v_user1::text AND (data->>'enhanced_match_id') = v_match_id::text) THEN
    INSERT INTO notifications(user_id, type, title, message, data, created_at)
    VALUES (
      v_user1::text,
      'new_match',
      'It''s a Match!',
      'You have a new match — say hi!',
      jsonb_build_object('enhanced_match_id', v_match_id, 'chat_room_id', v_chat_room_id),
      now()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = v_user2::text AND (data->>'enhanced_match_id') = v_match_id::text) THEN
    INSERT INTO notifications(user_id, type, title, message, data, created_at)
    VALUES (
      v_user2::text,
      'new_match',
      'It''s a Match!',
      'You have a new match — say hi!',
      jsonb_build_object('enhanced_match_id', v_match_id, 'chat_room_id', v_chat_room_id),
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'match_id', v_match_id,
    'chat_room_id', v_chat_room_id,
    'created_match', v_created_match,
    'created_chat', v_created_chat
  );
EXCEPTION WHEN others THEN
  RAISE;
END;
$$;

-- Create chat_requests table if not exists
CREATE TABLE IF NOT EXISTS chat_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id text NOT NULL,
  to_user_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending','accepted','declined'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_chat_request_pair ON chat_requests (from_user_id, to_user_id);

-- RPC to send request (atomic create + notification)
CREATE OR REPLACE FUNCTION public.send_chat_request(p_from text, p_to text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO chat_requests(from_user_id, to_user_id, status, created_at, updated_at)
  VALUES (p_from, p_to, 'pending', now(), now())
  ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id INTO v_id;

  -- Create notification for recipient
  INSERT INTO notifications(user_id, type, title, message, data, created_at)
  VALUES (
    p_to,
    'chat_request',
    'Chat request',
    format('User %s wants to chat with you', p_from),
    jsonb_build_object('chat_request_id', v_id, 'from_user_id', p_from),
    now()
  );

  RETURN jsonb_build_object('chat_request_id', v_id, 'status', 'pending');
END;
$$;

-- RPC to accept or decline
CREATE OR REPLACE FUNCTION public.respond_chat_request(p_request_id uuid, p_action text, p_actor text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_from text;
  v_to text;
  v_chat_room_id uuid;
BEGIN
  IF p_action NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'invalid action';
  END IF;

  UPDATE chat_requests
  SET status = p_action, updated_at = now()
  WHERE id = p_request_id
  RETURNING from_user_id, to_user_id INTO v_from, v_to;

  IF p_action = 'accepted' THEN
    -- create or find chat room between the two
    -- use the match-based chat if you prefer, otherwise create chat_room with participants
    -- For simplicity, create a chat_room that references no match
    INSERT INTO chat_rooms(match_id, user1_id, user2_id, created_at)
    VALUES (NULL, v_from, v_to, now())
    RETURNING id INTO v_chat_room_id;

    -- insert notifications to both users that chat was accepted
    INSERT INTO notifications(user_id, type, title, message, data, created_at)
    VALUES (v_from, 'chat_request_accepted', 'Chat accepted', format('User %s accepted your chat request', p_actor), jsonb_build_object('chat_room_id', v_chat_room_id, 'chat_request_id', p_request_id), now());

    INSERT INTO notifications(user_id, type, title, message, data, created_at)
    VALUES (v_to, 'chat_request_accepted', 'Chat accepted', 'You accepted the chat request', jsonb_build_object('chat_room_id', v_chat_room_id, 'chat_request_id', p_request_id), now());
  ELSE
    -- declined: notify the requester
    INSERT INTO notifications(user_id, type, title, message, data, created_at)
    VALUES (v_from, 'chat_request_declined', 'Chat declined', format('User %s declined your chat request', p_actor), jsonb_build_object('chat_request_id', p_request_id), now());
  END IF;

  RETURN jsonb_build_object('request_id', p_request_id, 'action', p_action, 'chat_room_id', v_chat_room_id);
END;
$$;

-- Enable Row-Level Security and create policies
ALTER TABLE enhanced_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS block_insert_client ON enhanced_matches;
DROP POLICY IF EXISTS enhanced_matches_select_for_participants ON enhanced_matches;
DROP POLICY IF EXISTS chat_rooms_select_for_participants ON chat_rooms;
DROP POLICY IF EXISTS chat_rooms_block_insert_client ON chat_rooms;
DROP POLICY IF EXISTS chat_requests_select_policy ON chat_requests;
DROP POLICY IF EXISTS chat_requests_block_insert_client ON chat_requests;

-- enhanced_matches: prevent client inserts, allow service role
CREATE POLICY block_insert_client ON enhanced_matches FOR INSERT USING (auth.role() = 'service_role');

-- allow select only for participants
CREATE POLICY enhanced_matches_select_for_participants ON enhanced_matches
FOR SELECT USING (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);

-- chat_rooms: clients may SELECT chat rooms they belong to; inserts done via server
CREATE POLICY chat_rooms_select_for_participants ON chat_rooms
FOR SELECT USING (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);

CREATE POLICY chat_rooms_block_insert_client ON chat_rooms FOR INSERT USING (auth.role() = 'service_role');

-- chat_requests: users can view their own requests
CREATE POLICY chat_requests_select_policy ON chat_requests
FOR SELECT USING (auth.uid()::text = from_user_id OR auth.uid()::text = to_user_id);

CREATE POLICY chat_requests_block_insert_client ON chat_requests FOR INSERT USING (auth.role() = 'service_role');