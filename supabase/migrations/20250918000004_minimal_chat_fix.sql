-- Minimal Chat System Fix - Avoiding all UUID/TEXT conflicts

-- Step 1: Add missing columns to chat_rooms
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS last_message TEXT,
ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP WITH TIME ZONE;

-- Step 2: Create messages table for socket server (all TEXT fields to avoid casting issues)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Simple RLS policies (no complex joins to avoid UUID/TEXT issues)
CREATE POLICY "Users can create their own messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = (auth.uid())::text
);

CREATE POLICY "Users can view all messages" ON public.messages
FOR SELECT USING (true);

-- Step 5: Simple sync function
CREATE OR REPLACE FUNCTION sync_message_to_enhanced()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_messages_enhanced (chat_room_id, sender_id, message_text, created_at)
  VALUES (NEW.room_id::uuid, NEW.sender_id, NEW.content, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create sync trigger
CREATE TRIGGER sync_to_enhanced_messages
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION sync_message_to_enhanced();

-- Step 7: Update chat room on new message
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

-- Step 8: Replace existing trigger
DROP TRIGGER IF EXISTS update_chat_room_on_message ON public.chat_messages_enhanced;
CREATE TRIGGER update_chat_room_on_message
AFTER INSERT ON public.chat_messages_enhanced
FOR EACH ROW EXECUTE FUNCTION update_chat_room_timestamp();

-- Step 9: Fix chat_messages_enhanced RLS policy
DROP POLICY IF EXISTS "TEMP: Users can create enhanced chat messages" ON public.chat_messages_enhanced;
DROP POLICY IF EXISTS "Users can create enhanced chat messages" ON public.chat_messages_enhanced;

CREATE POLICY "Users can create enhanced chat messages" ON public.chat_messages_enhanced
FOR INSERT WITH CHECK (
  sender_id = (auth.uid())::text
);

-- Step 10: Add indexes
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
