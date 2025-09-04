-- Drop ALL remaining policies that might reference user_id columns
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;
DROP POLICY IF EXISTS "System can insert compatibility scores" ON compatibility_scores;
DROP POLICY IF EXISTS "System can update compatibility scores" ON compatibility_scores;
DROP POLICY IF EXISTS "System can manage QCS" ON qcs;
DROP POLICY IF EXISTS "System can manage subscriptions" ON subscribers;
DROP POLICY IF EXISTS "System can manage subscription limits" ON subscription_limits;
DROP POLICY IF EXISTS "System can manage subscription history" ON subscription_history;
DROP POLICY IF EXISTS "View verified colleges" ON colleges;
DROP POLICY IF EXISTS "Test users are viewable by everyone" ON test_users;
DROP POLICY IF EXISTS "Anyone can view test credentials" ON test_credentials;

-- For chat_messages_enhanced table
DROP POLICY IF EXISTS "Users can view messages in their chats" ON chat_messages_enhanced;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages_enhanced;