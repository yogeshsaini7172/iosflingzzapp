-- Ensure REPLICA IDENTITY FULL for complete row data capture in realtime
ALTER TABLE enhanced_swipes REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE enhanced_matches REPLICA IDENTITY FULL;
ALTER TABLE chat_messages_enhanced REPLICA IDENTITY FULL;
ALTER TABLE chat_requests REPLICA IDENTITY FULL;

-- Also enable for profiles table for profile updates
ALTER TABLE profiles REPLICA IDENTITY FULL;