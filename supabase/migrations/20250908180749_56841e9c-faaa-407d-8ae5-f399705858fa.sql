-- Fix data type mismatches for Firebase Auth compatibility

-- Change sender_id from uuid to text to match Firebase UIDs
ALTER TABLE public.chat_messages_enhanced 
ALTER COLUMN sender_id TYPE text;

-- Ensure chat_rooms user fields are text (should already be, but let's make sure)
DO $$
BEGIN
    -- Check if user1_id is not text and change it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_rooms' 
        AND column_name = 'user1_id' 
        AND data_type != 'text'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.chat_rooms ALTER COLUMN user1_id TYPE text;
    END IF;
    
    -- Check if user2_id is not text and change it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_rooms' 
        AND column_name = 'user2_id' 
        AND data_type != 'text'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.chat_rooms ALTER COLUMN user2_id TYPE text;
    END IF;
END $$;

-- Update any existing RLS policies that might reference these columns incorrectly
-- The policies should already work with text fields, but let's ensure they're compatible

-- Add helpful comment for future reference
COMMENT ON COLUMN public.chat_messages_enhanced.sender_id IS 'Firebase Auth UID (text format)';
COMMENT ON COLUMN public.chat_rooms.user1_id IS 'Firebase Auth UID (text format)';
COMMENT ON COLUMN public.chat_rooms.user2_id IS 'Firebase Auth UID (text format)';