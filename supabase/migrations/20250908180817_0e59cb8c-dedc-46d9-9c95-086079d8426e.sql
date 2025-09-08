-- Fix data type mismatches for Firebase Auth compatibility
-- Step 1: Drop the conflicting RLS policy temporarily

DROP POLICY IF EXISTS "Users can create enhanced chat messages" ON public.chat_messages_enhanced;

-- Step 2: Change sender_id from uuid to text to match Firebase UIDs
ALTER TABLE public.chat_messages_enhanced 
ALTER COLUMN sender_id TYPE text;

-- Step 3: Recreate the RLS policy with correct text comparison
CREATE POLICY "Users can create enhanced chat messages" 
ON public.chat_messages_enhanced 
FOR INSERT 
WITH CHECK (
  (auth.uid())::text = sender_id 
  AND EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages_enhanced.chat_room_id 
    AND (chat_rooms.user1_id = (auth.uid())::text OR chat_rooms.user2_id = (auth.uid())::text)
  )
);

-- Step 4: Also fix the SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view their enhanced chat messages" ON public.chat_messages_enhanced;

CREATE POLICY "Users can view their enhanced chat messages" 
ON public.chat_messages_enhanced 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages_enhanced.chat_room_id 
    AND (chat_rooms.user1_id = (auth.uid())::text OR chat_rooms.user2_id = (auth.uid())::text)
  )
);

-- Step 5: Add helpful comments
COMMENT ON COLUMN public.chat_messages_enhanced.sender_id IS 'Firebase Auth UID (text format)';