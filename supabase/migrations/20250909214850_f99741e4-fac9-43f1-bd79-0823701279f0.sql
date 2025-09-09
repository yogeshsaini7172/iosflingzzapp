-- Enable realtime for key tables used in notifications and matching

-- Set REPLICA IDENTITY FULL to capture complete row data for realtime
ALTER TABLE enhanced_swipes REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE enhanced_matches REPLICA IDENTITY FULL;
ALTER TABLE chat_messages_enhanced REPLICA IDENTITY FULL;
ALTER TABLE chat_requests REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication to enable realtime functionality
ALTER PUBLICATION supabase_realtime ADD TABLE enhanced_swipes;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE enhanced_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages_enhanced;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_requests;