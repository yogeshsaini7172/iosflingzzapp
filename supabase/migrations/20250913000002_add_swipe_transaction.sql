-- Create a function to handle swipes in a transaction
CREATE OR REPLACE FUNCTION record_enhanced_swipe(
    p_user_id TEXT,
    p_target_user_id TEXT,
    p_direction TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_other_swipe RECORD;
    v_match_id UUID;
    v_chat_room_id UUID;
    v_user1_id TEXT;
    v_user2_id TEXT;
    v_result JSON;
BEGIN
    -- Start transaction
    BEGIN
        -- Insert the swipe
        INSERT INTO enhanced_swipes (user_id, target_user_id, direction)
        VALUES (p_user_id, p_target_user_id, p_direction);
        
        -- If right swipe, check for match
        IF p_direction = 'right' THEN
            -- Check for existing right swipe from target user
            SELECT * INTO v_other_swipe
            FROM enhanced_swipes
            WHERE user_id = p_target_user_id
            AND target_user_id = p_user_id
            AND direction = 'right';
            
            -- If mutual like, create match
            IF FOUND THEN
                -- Determine user order (for consistency)
                v_user1_id := LEAST(p_user_id, p_target_user_id);
                v_user2_id := GREATEST(p_user_id, p_target_user_id);
                
                -- Create or get match
                INSERT INTO enhanced_matches (user1_id, user2_id, status)
                VALUES (v_user1_id, v_user2_id, 'matched')
                ON CONFLICT (user1_id, user2_id) 
                DO UPDATE SET status = 'matched', updated_at = now()
                RETURNING id INTO v_match_id;
                
                -- Create chat room
                INSERT INTO chat_rooms (match_id, user1_id, user2_id)
                VALUES (v_match_id, v_user1_id, v_user2_id)
                ON CONFLICT (match_id) 
                DO NOTHING
                RETURNING id INTO v_chat_room_id;
                
                -- Create notifications
                INSERT INTO notifications (user_id, type, title, message, data)
                VALUES
                    (v_user1_id, 'new_match', 'It''s a Match! 🎉', 
                     format('You matched with someone!'), 
                     jsonb_build_object(
                         'enhanced_match_id', v_match_id,
                         'chat_room_id', v_chat_room_id,
                         'other_user_id', v_user2_id
                     )),
                    (v_user2_id, 'new_match', 'It''s a Match! 🎉',
                     format('You matched with someone!'),
                     jsonb_build_object(
                         'enhanced_match_id', v_match_id,
                         'chat_room_id', v_chat_room_id,
                         'other_user_id', v_user1_id
                     ));
                     
                -- Prepare success response with match details
                v_result := json_build_object(
                    'is_match', true,
                    'match_id', v_match_id,
                    'chat_room_id', v_chat_room_id
                );
            ELSE
                -- No match yet
                v_result := json_build_object(
                    'is_match', false
                );
            END IF;
        ELSE
            -- Left swipe - no match possible
            v_result := json_build_object(
                'is_match', false
            );
        END IF;
        
        RETURN v_result;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE EXCEPTION 'Duplicate swipe detected'
                USING HINT = 'User has already swiped on this profile',
                      DETAIL = format('User %s has already swiped on user %s', p_user_id, p_target_user_id);
                      
        WHEN foreign_key_violation THEN
            RAISE EXCEPTION 'Invalid user reference'
                USING HINT = 'One or both users do not exist',
                      DETAIL = format('Invalid user reference: %s or %s', p_user_id, p_target_user_id);
                      
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to process swipe'
                USING HINT = 'An unexpected error occurred',
                      DETAIL = SQLERRM;
    END;
END;
$$;