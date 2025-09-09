-- Set REPLICA IDENTITY FULL for chat tables (safe to re-run)
ALTER TABLE chat_messages_enhanced REPLICA IDENTITY FULL;
ALTER TABLE chat_requests REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;

-- Add tables to realtime publication (only add what's not already there)
DO $$
BEGIN
    -- Add chat_requests if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_requests;
    END IF;
    
    -- Add notifications if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
    
    -- Add chat_rooms if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
    END IF;
END
$$;