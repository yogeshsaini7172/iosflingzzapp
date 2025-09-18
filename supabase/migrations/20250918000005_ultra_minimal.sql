-- Ultra Minimal Chat Fix - Step by step to avoid errors

-- Step 1: Add missing columns to chat_rooms
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS last_message TEXT,
ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP WITH TIME ZONE;

-- Step 2: Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Very simple RLS policies
CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT USING (true);
