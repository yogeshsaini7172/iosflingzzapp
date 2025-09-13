-- Temporary Development RLS Policy Changes
-- IMPORTANT: Revert these after development is complete!

-- Allow users to create their own chat rooms
CREATE POLICY "TEMP: Users can create chat rooms"
ON public.chat_rooms
FOR INSERT
WITH CHECK (
  (user1_id = (auth.uid())::text) OR (user2_id = (auth.uid())::text)
);

-- Allow users to create enhanced matches
CREATE POLICY "TEMP: Users can create enhanced matches"
ON public.enhanced_matches
FOR INSERT
WITH CHECK (
  (user1_id = (auth.uid())::text) OR (user2_id = (auth.uid())::text)
);

-- Allow users to update enhanced matches
CREATE POLICY "TEMP: Users can update enhanced matches"
ON public.enhanced_matches
FOR UPDATE
USING (
  (user1_id = (auth.uid())::text) OR (user2_id = (auth.uid())::text)
);

-- Allow users to create notifications for themselves
CREATE POLICY "TEMP: Users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  user_id = (auth.uid())::text
);

-- Allow users to insert into messages table
CREATE POLICY "TEMP: Users can create messages"
ON public.messages
FOR INSERT
WITH CHECK (
  (auth.uid())::text = (sender_id)::text
);

-- Make chat_messages_enhanced policy less restrictive
DROP POLICY IF EXISTS "Users can create enhanced chat messages" ON public.chat_messages_enhanced;
CREATE POLICY "TEMP: Users can create enhanced chat messages"
ON public.chat_messages_enhanced
FOR INSERT
WITH CHECK (
  sender_id = (auth.uid())::text
);

-- Add comment for easy identification
COMMENT ON TABLE public.chat_rooms IS 'TEMP POLICIES ACTIVE - REVERT AFTER DEVELOPMENT';
COMMENT ON TABLE public.enhanced_matches IS 'TEMP POLICIES ACTIVE - REVERT AFTER DEVELOPMENT';
COMMENT ON TABLE public.notifications IS 'TEMP POLICIES ACTIVE - REVERT AFTER DEVELOPMENT';