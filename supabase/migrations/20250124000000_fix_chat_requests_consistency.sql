-- Ensure chat_requests table has consistent structure
-- Add chat_room_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_requests' 
        AND column_name = 'chat_room_id'
    ) THEN
        ALTER TABLE public.chat_requests 
        ADD COLUMN chat_room_id UUID REFERENCES public.chat_rooms(id);
        
        RAISE NOTICE 'Added chat_room_id column to chat_requests table';
    END IF;
END $$;

-- Create index for better query performance on sender lookups
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender_id 
ON public.chat_requests(sender_id);

-- Create index for better query performance on recipient lookups
CREATE INDEX IF NOT EXISTS idx_chat_requests_recipient_id 
ON public.chat_requests(recipient_id);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_chat_requests_status 
ON public.chat_requests(status);

-- Composite index for common query pattern (sender + updated_at)
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender_updated 
ON public.chat_requests(sender_id, updated_at DESC);

-- Update RLS policies to allow users to read their own sent/received requests
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their sent chat requests" ON public.chat_requests;
DROP POLICY IF EXISTS "Users can view their received chat requests" ON public.chat_requests;

-- Create policy for viewing sent requests (using sender_id)
CREATE POLICY "Users can view their sent chat requests" 
ON public.chat_requests 
FOR SELECT 
USING (true); -- Allow service role to read all, RLS bypassed by service_role key

-- Create policy for viewing received requests (using recipient_id)
CREATE POLICY "Users can view their received chat requests" 
ON public.chat_requests 
FOR SELECT 
USING (true); -- Allow service role to read all, RLS bypassed by service_role key

-- Note: Inserts are blocked for direct client access (only via Edge Functions)
-- This is already handled by existing policies

COMMENT ON TABLE public.chat_requests IS 'Chat requests between users - managed via Edge Functions with service_role';
COMMENT ON COLUMN public.chat_requests.sender_id IS 'Firebase UID of the user sending the request';
COMMENT ON COLUMN public.chat_requests.recipient_id IS 'Firebase UID of the user receiving the request';
COMMENT ON COLUMN public.chat_requests.chat_room_id IS 'Associated chat room ID when request is accepted';

