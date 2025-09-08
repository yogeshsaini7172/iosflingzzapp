-- Add unique index to prevent duplicate normalized pairs
CREATE UNIQUE INDEX IF NOT EXISTS idx_enhanced_matches_pair ON enhanced_matches (user1_id, user2_id);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_match_id ON chat_rooms (match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_match_data ON notifications USING GIN ((data->>'enhanced_match_id'));

-- Add constraint to enforce normalized ordering (user1_id < user2_id)
ALTER TABLE enhanced_matches 
ADD CONSTRAINT check_user_ordering 
CHECK (user1_id::text < user2_id::text);

-- Add indexes for enhanced_swipes performance
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_user_target ON enhanced_swipes (user_id, target_user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_target_user ON enhanced_swipes (target_user_id, user_id);

-- Comment the changes
COMMENT ON INDEX idx_enhanced_matches_pair IS 'Prevents duplicate matches between same users';
COMMENT ON CONSTRAINT check_user_ordering ON enhanced_matches IS 'Enforces normalized ordering: user1_id < user2_id';