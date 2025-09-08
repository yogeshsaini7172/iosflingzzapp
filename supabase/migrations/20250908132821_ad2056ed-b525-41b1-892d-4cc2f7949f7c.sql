-- 1. Create unique index to prevent duplicate match pairs
CREATE UNIQUE INDEX IF NOT EXISTS ux_enhanced_matches_pair
ON enhanced_matches (user1_id, user2_id);

-- 2. Create transactional stored procedure to atomically create match, chat room, notifications
CREATE OR REPLACE FUNCTION public.create_match_and_chat(
  p_actor_id text,      -- the user who initiated the swipe that completed the match (optional)
  p_a text,             -- user A id
  p_b text              -- user B id
)
RETURNS jsonb
LANGUAGE plpgsql
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
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = v_user1 AND (data->>'enhanced_match_id') = v_match_id::text) THEN
    INSERT INTO notifications(user_id, type, title, message, data, created_at)
    VALUES (
      v_user1,
      'new_match',
      'It''s a Match!',
      'You have a new match — say hi!',
      jsonb_build_object('enhanced_match_id', v_match_id, 'chat_room_id', v_chat_room_id),
      now()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = v_user2 AND (data->>'enhanced_match_id') = v_match_id::text) THEN
    INSERT INTO notifications(user_id, type, title, message, data, created_at)
    VALUES (
      v_user2,
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

-- 3. Enhanced RLS policies - allow service role to insert, users to select their own data
ALTER TABLE enhanced_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create enhanced matches for themselves" ON enhanced_matches;
DROP POLICY IF EXISTS "Users can view their enhanced matches" ON enhanced_matches;
DROP POLICY IF EXISTS "Users can update their enhanced matches" ON enhanced_matches;

CREATE POLICY "Service role can manage enhanced matches" ON enhanced_matches FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view their enhanced matches" ON enhanced_matches FOR SELECT USING (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);

-- 4. Chat rooms RLS policies
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create their own chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can update their own chat rooms" ON chat_rooms;

CREATE POLICY "Service role can manage chat rooms" ON chat_rooms FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view their chat rooms" ON chat_rooms FOR SELECT USING (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);