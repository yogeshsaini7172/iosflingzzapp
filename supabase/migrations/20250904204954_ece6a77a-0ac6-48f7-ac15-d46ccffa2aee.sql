-- Update user_id columns from uuid to text to support Firebase user IDs
-- Firebase user IDs are strings, not UUIDs

-- First, drop foreign key constraints and indexes that reference user_id columns
DROP INDEX IF EXISTS idx_profiles_user_id;
DROP INDEX IF EXISTS idx_partner_preferences_user_id;
DROP INDEX IF EXISTS idx_qcs_user_id;
DROP INDEX IF EXISTS idx_subscription_limits_user_id;
DROP INDEX IF EXISTS idx_subscribers_user_id;
DROP INDEX IF EXISTS idx_subscription_history_user_id;
DROP INDEX IF EXISTS idx_identity_verifications_user_id;
DROP INDEX IF EXISTS idx_blocks_user_id;
DROP INDEX IF EXISTS idx_enhanced_swipes_user_id;
DROP INDEX IF EXISTS idx_enhanced_matches_user1_id;
DROP INDEX IF EXISTS idx_enhanced_matches_user2_id;
DROP INDEX IF EXISTS idx_swipes_user_id;
DROP INDEX IF EXISTS idx_matches_liker_id;
DROP INDEX IF EXISTS idx_matches_liked_id;
DROP INDEX IF EXISTS idx_chat_rooms_user1_id;
DROP INDEX IF EXISTS idx_chat_rooms_user2_id;
DROP INDEX IF EXISTS idx_chat_messages_sender_id;
DROP INDEX IF EXISTS idx_user_interactions_user_id;
DROP INDEX IF EXISTS idx_blind_dates_requester_id;
DROP INDEX IF EXISTS idx_blind_dates_recipient_id;
DROP INDEX IF EXISTS idx_admin_reports_reporter_id;
DROP INDEX IF EXISTS idx_admin_reports_reported_user_id;
DROP INDEX IF EXISTS idx_compatibility_scores_user1_id;
DROP INDEX IF EXISTS idx_compatibility_scores_user2_id;

-- Update all user_id columns from uuid to text
ALTER TABLE profiles ALTER COLUMN user_id TYPE text;
ALTER TABLE partner_preferences ALTER COLUMN user_id TYPE text;
ALTER TABLE qcs ALTER COLUMN user_id TYPE text;
ALTER TABLE subscription_limits ALTER COLUMN user_id TYPE text;
ALTER TABLE subscribers ALTER COLUMN user_id TYPE text;
ALTER TABLE subscription_history ALTER COLUMN user_id TYPE text;
ALTER TABLE identity_verifications ALTER COLUMN user_id TYPE text;
ALTER TABLE blocks ALTER COLUMN user_id TYPE text;
ALTER TABLE blocks ALTER COLUMN blocked_user_id TYPE text;
ALTER TABLE enhanced_swipes ALTER COLUMN user_id TYPE text;
ALTER TABLE enhanced_swipes ALTER COLUMN target_user_id TYPE text;
ALTER TABLE enhanced_matches ALTER COLUMN user1_id TYPE text;
ALTER TABLE enhanced_matches ALTER COLUMN user2_id TYPE text;
ALTER TABLE swipes ALTER COLUMN user_id TYPE text;
ALTER TABLE swipes ALTER COLUMN candidate_id TYPE text;
ALTER TABLE matches ALTER COLUMN liker_id TYPE text;
ALTER TABLE matches ALTER COLUMN liked_id TYPE text;
ALTER TABLE chat_rooms ALTER COLUMN user1_id TYPE text;
ALTER TABLE chat_rooms ALTER COLUMN user2_id TYPE text;
ALTER TABLE chat_messages ALTER COLUMN sender_id TYPE text;
ALTER TABLE user_interactions ALTER COLUMN user_id TYPE text;
ALTER TABLE user_interactions ALTER COLUMN target_user_id TYPE text;
ALTER TABLE blind_dates ALTER COLUMN requester_id TYPE text;
ALTER TABLE blind_dates ALTER COLUMN recipient_id TYPE text;
ALTER TABLE admin_reports ALTER COLUMN reporter_id TYPE text;
ALTER TABLE admin_reports ALTER COLUMN reported_user_id TYPE text;
ALTER TABLE admin_reports ALTER COLUMN reviewed_by TYPE text;
ALTER TABLE compatibility_scores ALTER COLUMN user1_id TYPE text;
ALTER TABLE compatibility_scores ALTER COLUMN user2_id TYPE text;

-- Recreate indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_partner_preferences_user_id ON partner_preferences(user_id);
CREATE INDEX idx_qcs_user_id ON qcs(user_id);
CREATE INDEX idx_subscription_limits_user_id ON subscription_limits(user_id);
CREATE INDEX idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX idx_blocks_user_id ON blocks(user_id);
CREATE INDEX idx_enhanced_swipes_user_id ON enhanced_swipes(user_id);
CREATE INDEX idx_enhanced_matches_user1_id ON enhanced_matches(user1_id);
CREATE INDEX idx_enhanced_matches_user2_id ON enhanced_matches(user2_id);
CREATE INDEX idx_swipes_user_id ON swipes(user_id);
CREATE INDEX idx_matches_liker_id ON matches(liker_id);
CREATE INDEX idx_matches_liked_id ON matches(liked_id);
CREATE INDEX idx_chat_rooms_user1_id ON chat_rooms(user1_id);
CREATE INDEX idx_chat_rooms_user2_id ON chat_rooms(user2_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_blind_dates_requester_id ON blind_dates(requester_id);
CREATE INDEX idx_blind_dates_recipient_id ON blind_dates(recipient_id);
CREATE INDEX idx_admin_reports_reporter_id ON admin_reports(reporter_id);
CREATE INDEX idx_compatibility_scores_user1_id ON compatibility_scores(user1_id);
CREATE INDEX idx_compatibility_scores_user2_id ON compatibility_scores(user2_id);

-- Update the handle_new_user function to work with Firebase user IDs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    email,
    date_of_birth,
    gender,
    university,
    verification_status,
    is_active,
    last_active
  )
  VALUES (
    NEW.id::text, -- Convert to text for Firebase compatibility
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.email, ''),
    CURRENT_DATE,
    'prefer_not_to_say'::gender,
    COALESCE(NEW.raw_user_meta_data->>'university', ''),
    'pending',
    true,
    now()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
END;
$$;