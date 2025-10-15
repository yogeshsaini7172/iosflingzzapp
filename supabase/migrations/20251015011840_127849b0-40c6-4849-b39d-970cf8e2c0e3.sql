-- Drop threads-related tables and cleanup function
DROP TABLE IF EXISTS public.thread_likes CASCADE;
DROP TABLE IF EXISTS public.thread_replies CASCADE;
DROP TABLE IF EXISTS public.threads CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_threads() CASCADE;
DROP FUNCTION IF EXISTS public.update_thread_counts() CASCADE;
DROP FUNCTION IF EXISTS public.create_thread_as_user(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_thread_reply_as_user(uuid, text, text) CASCADE;

-- Create consulting_requests table for storing consulting form submissions
CREATE TABLE public.consulting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  description TEXT NOT NULL,
  existing_preferences JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consulting_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own consulting requests
CREATE POLICY "Users can view their own consulting requests"
ON public.consulting_requests
FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can create their own consulting requests
CREATE POLICY "Users can create consulting requests"
ON public.consulting_requests
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own consulting requests
CREATE POLICY "Users can update their own consulting requests"
ON public.consulting_requests
FOR UPDATE
USING (auth.uid()::text = user_id);

-- Service role can manage all consulting requests
CREATE POLICY "Service role can manage consulting requests"
ON public.consulting_requests
FOR ALL
USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_consulting_requests_updated_at
BEFORE UPDATE ON public.consulting_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();