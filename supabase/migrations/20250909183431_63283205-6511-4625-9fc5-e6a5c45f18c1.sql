-- Add unique constraints to prevent duplicate swipes and matches
-- Ensure unique swipe records
ALTER TABLE enhanced_swipes 
ADD CONSTRAINT IF NOT EXISTS unique_swipe_pair UNIQUE (user_id, target_user_id);

-- Ensure unique match pairs (canonical ordering with user1_id < user2_id)
CREATE UNIQUE INDEX IF NOT EXISTS ux_enhanced_matches_pair
ON enhanced_matches (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

-- Create RPC function for atomic feed retrieval (server-side only)
CREATE OR REPLACE FUNCTION rpc_get_feed_for_user(p_user_id text, p_limit int DEFAULT 30)
RETURNS TABLE (
  id uuid,
  user_id text,
  firebase_uid text,
  first_name text,
  last_name text,
  date_of_birth date,
  bio text,
  profile_images text[],
  university text,
  interests text[],
  relationship_goals text[],
  total_qcs integer,
  gender gender,
  height integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.user_id, p.firebase_uid, p.first_name, p.last_name, p.date_of_birth, p.bio, 
         p.profile_images, p.university, p.interests, p.relationship_goals, p.total_qcs, 
         p.gender, p.height
  FROM profiles p
  WHERE p.is_active = true
    AND p.show_profile = true
    AND p.firebase_uid != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM enhanced_swipes s 
      WHERE s.user_id = p_user_id AND s.target_user_id = p.firebase_uid
    )
    AND NOT EXISTS (
      SELECT 1 FROM user_interactions ui 
      WHERE ui.user_id = p_user_id AND ui.target_user_id = p.firebase_uid 
      AND ui.interaction_type = 'blocked'
    )
  ORDER BY p.last_active DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create RPC function for atomic swipe and match creation
CREATE OR REPLACE FUNCTION rpc_atomic_swipe_and_match(
  p_swiper_uid text,
  p_target_uid text,
  p_direction text
)
RETURNS jsonb AS $$
DECLARE
  v_match_created boolean := false;
  v_match_id uuid;
  v_chat_room_id uuid;
  v_swipe_id uuid;
  v_user1 text;
  v_user2 text;
BEGIN
  -- Insert swipe record (will fail if duplicate due to unique constraint)
  BEGIN
    INSERT INTO enhanced_swipes (user_id, target_user_id, direction)
    VALUES (p_swiper_uid, p_target_uid, p_direction)
    RETURNING id INTO v_swipe_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Swipe already recorded',
      'swipe_id', null,
      'match_created', false
    );
  END;

  -- If right swipe, check for mutual match
  IF p_direction = 'right' THEN
    -- Check if target user already swiped right on swiper
    IF EXISTS (
      SELECT 1 FROM enhanced_swipes 
      WHERE user_id = p_target_uid 
        AND target_user_id = p_swiper_uid 
        AND direction = 'right'
    ) THEN
      -- Create match with canonical ordering
      IF p_swiper_uid < p_target_uid THEN
        v_user1 := p_swiper_uid;
        v_user2 := p_target_uid;
      ELSE
        v_user1 := p_target_uid;
        v_user2 := p_swiper_uid;
      END IF;

      -- Insert match if not exists
      BEGIN
        INSERT INTO enhanced_matches (user1_id, user2_id, status, created_at)
        VALUES (v_user1, v_user2, 'matched', now())
        RETURNING id INTO v_match_id;
        
        v_match_created := true;
        
        -- Create chat room
        INSERT INTO chat_rooms (match_id, user1_id, user2_id, created_at)
        VALUES (v_match_id, v_user1, v_user2, now())
        RETURNING id INTO v_chat_room_id;
        
      EXCEPTION WHEN unique_violation THEN
        -- Match already exists, get the existing one
        SELECT id INTO v_match_id FROM enhanced_matches 
        WHERE LEAST(user1_id, user2_id) = v_user1 
          AND GREATEST(user1_id, user2_id) = v_user2;
          
        SELECT id INTO v_chat_room_id FROM chat_rooms WHERE match_id = v_match_id;
      END;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'swipe_id', v_swipe_id,
    'match_created', v_match_created,
    'match_id', v_match_id,
    'chat_room_id', v_chat_room_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC for atomic subscription check and swipe consumption
CREATE OR REPLACE FUNCTION rpc_check_and_consume_swipe(p_user_id text)
RETURNS jsonb AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_swipes_left integer;
  v_unlimited boolean := false;
BEGIN
  -- Get user profile with FOR UPDATE to prevent race conditions
  SELECT * INTO v_profile FROM profiles 
  WHERE firebase_uid = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Check if user has unlimited swipes (Plus/Pro plans)
  IF v_profile.plan_id IN ('plus_89', 'pro_129') THEN
    v_unlimited := true;
  END IF;

  -- If not unlimited, check swipes left
  IF NOT v_unlimited THEN
    v_swipes_left := COALESCE(v_profile.swipes_left, 0);
    
    IF v_swipes_left <= 0 THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'No swipes remaining',
        'swipes_left', v_swipes_left
      );
    END IF;
    
    -- Consume a swipe
    UPDATE profiles 
    SET swipes_left = swipes_left - 1,
        daily_swipes_used = COALESCE(daily_swipes_used, 0) + 1
    WHERE firebase_uid = p_user_id;
    
    v_swipes_left := v_swipes_left - 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'swipes_left', CASE WHEN v_unlimited THEN -1 ELSE v_swipes_left END,
    'unlimited', v_unlimited
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;