-- Add foreign key constraints for chat_requests table
ALTER TABLE public.chat_requests 
ADD CONSTRAINT chat_requests_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.chat_requests 
ADD CONSTRAINT chat_requests_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES public.profiles(user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_requests_recipient_status 
ON public.chat_requests (recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_chat_requests_sender 
ON public.chat_requests (sender_id);