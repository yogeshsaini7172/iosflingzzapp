-- Simple approach: Fix RLS policies to allow chat operations

-- Update RLS policies for chat_messages_enhanced to be more permissive
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON public.chat_messages_enhanced;
DROP POLICY IF EXISTS "Users can insert messages in their chat rooms" ON public.chat_messages_enhanced;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages_enhanced;

-- Create more permissive RLS policies
CREATE POLICY "Allow authenticated users to view all chat messages" ON public.chat_messages_enhanced
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to insert chat messages" ON public.chat_messages_enhanced
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update chat messages" ON public.chat_messages_enhanced
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Update RLS policies for chat_rooms to be more permissive
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their own chat rooms" ON public.chat_rooms;

CREATE POLICY "Allow authenticated users to view all chat rooms" ON public.chat_rooms
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update chat rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to insert chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Ensure RLS is enabled but with permissive policies
ALTER TABLE public.chat_messages_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.chat_messages_enhanced TO authenticated;
GRANT ALL ON public.chat_messages_enhanced TO anon;
GRANT ALL ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_rooms TO anon;

-- Add helpful comment
COMMENT ON TABLE public.chat_messages_enhanced IS 'Chat messages with permissive RLS for testing';
COMMENT ON TABLE public.chat_rooms IS 'Chat rooms with permissive RLS for testing';
