-- Performance optimization: Add indexes for pairing queries

-- Profiles table indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON profiles(firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_active_priority ON profiles(is_active, priority_score DESC, last_active DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_qcs ON profiles(total_qcs DESC) WHERE is_active = true;

-- Enhanced swipes indexes for exclusion checks
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_user_target ON enhanced_swipes(user_id, target_user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_direction ON enhanced_swipes(user_id, direction, created_at DESC);

-- User interactions indexes for blocking/ghosting checks
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_target ON user_interactions(user_id, target_user_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_expires ON user_interactions(expires_at) WHERE expires_at IS NOT NULL;

-- Chat rooms indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_rooms_users ON chat_rooms(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_match ON chat_rooms(match_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_updated ON chat_rooms(updated_at DESC);

-- Enhanced matches indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_matches_users ON enhanced_matches(user1_id, user2_id, status);
CREATE INDEX IF NOT EXISTS idx_enhanced_matches_status ON enhanced_matches(status, created_at DESC);

-- Compatibility scores indexes
CREATE INDEX IF NOT EXISTS idx_compatibility_scores_users ON compatibility_scores(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_scores_calculated ON compatibility_scores(calculated_at DESC);

-- Partner preferences indexes
CREATE INDEX IF NOT EXISTS idx_partner_preferences_user ON partner_preferences(user_id);

-- QCS table indexes
CREATE INDEX IF NOT EXISTS idx_qcs_user_score ON qcs(user_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_qcs_updated ON qcs(updated_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON chat_messages_enhanced(chat_room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages_enhanced(sender_id, created_at DESC);