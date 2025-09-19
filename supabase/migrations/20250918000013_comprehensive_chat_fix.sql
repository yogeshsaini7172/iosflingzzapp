-- Comprehensive chat system fix

-- First, ensure chat_rooms has the right column types and missing columns
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS last_message TEXT,
ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMPTZ;

-- Update column types to handle TEXT user IDs (Firebase UIDs)
-- Note: This assumes your user IDs are already TEXT. If they're UUID, we need to handle conversion.

-- Drop all existing RLS policies that use current_setting
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.chat_messages_enhanced;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages_enhanced;
DROP POLICY IF EXISTS "Users can insert messages in their chat rooms" ON public.chat_messages_enhanced;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages_enhanced;

-- Create Firebase-auth compatible RLS policies for chat_rooms
CREATE POLICY "Firebase users can view their chat rooms" ON public.chat_rooms
  FOR SELECT USING (
    auth.jwt() ->> 'sub' = user1_id OR 
    auth.jwt() ->> 'sub' = user2_id OR
    auth.role() = 'anon'
  );

CREATE POLICY "Firebase users can create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'sub' = user1_id OR 
    auth.jwt() ->> 'sub' = user2_id OR
    auth.role() = 'anon'
  );

CREATE POLICY "Firebase users can update their chat rooms" ON public.chat_rooms
  FOR UPDATE USING (
    auth.jwt() ->> 'sub' = user1_id OR 
    auth.jwt() ->> 'sub' = user2_id OR
    auth.role() = 'anon'
  );

-- Create Firebase-auth compatible RLS policies for chat_messages_enhanced
CREATE POLICY "Firebase users can view messages in their chats" ON public.chat_messages_enhanced
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = chat_room_id 
      AND (
        auth.jwt() ->> 'sub' = user1_id OR 
        auth.jwt() ->> 'sub' = user2_id OR
        auth.role() = 'anon'
      )
    )
  );

CREATE POLICY "Firebase users can send messages" ON public.chat_messages_enhanced
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'sub' = sender_id OR
    auth.role() = 'anon'
  );

CREATE POLICY "Firebase users can update their messages" ON public.chat_messages_enhanced
  FOR UPDATE USING (
    auth.jwt() ->> 'sub' = sender_id OR
    auth.role() = 'anon'
  );

-- Ensure RLS is enabled
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages_enhanced ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_rooms TO anon;
GRANT ALL ON public.chat_messages_enhanced TO authenticated;
GRANT ALL ON public.chat_messages_enhanced TO anon;

-- Create or update the trigger function for updating chat room timestamps
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms 
  SET 
    updated_at = now(),
    last_message = NEW.message_text,
    last_message_time = NEW.created_at
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update chat room when new message is added
DROP TRIGGER IF EXISTS trigger_update_chat_room_timestamp ON public.chat_messages_enhanced;
CREATE TRIGGER trigger_update_chat_room_timestamp
  AFTER INSERT ON public.chat_messages_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_room_timestamp();

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_users ON public.chat_rooms (user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON public.chat_messages_enhanced (chat_room_id, created_at);

-- Add comments
COMMENT ON TABLE public.chat_rooms IS 'Chat rooms with Firebase-compatible RLS policies';
COMMENT ON TABLE public.chat_messages_enhanced IS 'Chat messages with Firebase-compatible RLS policies and auto-updating room timestamps';
