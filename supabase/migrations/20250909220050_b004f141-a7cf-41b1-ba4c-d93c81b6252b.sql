-- Enable real-time for chat and notification tables
ALTER TABLE chat_messages_enhanced REPLICA IDENTITY FULL;
ALTER TABLE chat_requests REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages_enhanced;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;