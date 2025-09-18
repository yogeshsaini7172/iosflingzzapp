-- Add sync functions for chat system

-- Step 1: Create function to sync messages from 'messages' to 'chat_messages_enhanced'
CREATE OR REPLACE FUNCTION sync_message_to_enhanced()
RETURNS TRIGGER AS $$
BEGIN
  -- Use CAST to safely convert TEXT to UUID
  INSERT INTO public.chat_messages_enhanced (chat_room_id, sender_id, message_text, created_at)
  VALUES (CAST(NEW.room_id AS uuid), NEW.sender_id, NEW.content, NEW.created_at);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the original insert
    RAISE WARNING 'Failed to sync message to enhanced table: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to sync messages
CREATE TRIGGER sync_to_enhanced_messages
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION sync_message_to_enhanced();

-- Step 3: Create function to update chat room timestamp
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the original insert
    RAISE WARNING 'Failed to update chat room timestamp: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Replace existing trigger
DROP TRIGGER IF EXISTS update_chat_room_on_message ON public.chat_messages_enhanced;
CREATE TRIGGER update_chat_room_on_message
AFTER INSERT ON public.chat_messages_enhanced
FOR EACH ROW EXECUTE FUNCTION update_chat_room_timestamp();

-- Step 5: Update RLS policy for chat_messages_enhanced (remove restrictive policies)
DROP POLICY IF EXISTS "TEMP: Users can create enhanced chat messages" ON public.chat_messages_enhanced;
DROP POLICY IF EXISTS "Users can create enhanced chat messages" ON public.chat_messages_enhanced;

CREATE POLICY "enhanced_messages_insert_policy" ON public.chat_messages_enhanced
FOR INSERT WITH CHECK (
  sender_id = (auth.uid())::text
);

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- Step 7: Add helpful comments
COMMENT ON TABLE public.messages IS 'Socket.IO compatibility table - syncs to chat_messages_enhanced';
COMMENT ON FUNCTION sync_message_to_enhanced() IS 'Syncs messages from socket server to main chat table';
