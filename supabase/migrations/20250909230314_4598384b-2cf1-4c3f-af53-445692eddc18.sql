-- Enable real-time for thread_replies table
ALTER TABLE thread_replies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE thread_replies;