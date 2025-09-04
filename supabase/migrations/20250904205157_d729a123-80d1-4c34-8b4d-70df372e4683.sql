-- Step 2a: Drop foreign key constraint that prevents column type change
ALTER TABLE test_users DROP CONSTRAINT IF EXISTS test_users_profile_id_fkey;

-- Step 2b: Update all user_id columns from uuid to text
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

-- Step 2c: Update test_users profile_id to text as well
ALTER TABLE test_users ALTER COLUMN profile_id TYPE text;

-- Step 2d: Recreate the foreign key constraint if needed
-- ALTER TABLE test_users ADD CONSTRAINT test_users_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(user_id);