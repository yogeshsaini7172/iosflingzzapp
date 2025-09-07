-- Check and create missing tables for thread functionality
DO $$ 
BEGIN
    -- Create threads table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'threads') THEN
        CREATE TABLE public.threads (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL CHECK (length(content) <= 280),
            likes_count INTEGER NOT NULL DEFAULT 0,
            replies_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create thread_replies table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'thread_replies') THEN
        CREATE TABLE public.thread_replies (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL CHECK (length(content) <= 280),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.thread_replies ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create thread_likes table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'thread_likes') THEN
        CREATE TABLE public.thread_likes (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            UNIQUE(thread_id, user_id)
        );
        
        ALTER TABLE public.thread_likes ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create chat_requests table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_requests') THEN
        CREATE TABLE public.chat_requests (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            sender_id TEXT NOT NULL,
            recipient_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
            message TEXT,
            compatibility_score INTEGER,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            UNIQUE(sender_id, recipient_id)
        );
        
        ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create or replace policies for threads
DROP POLICY IF EXISTS "Anyone can view threads" ON public.threads;
CREATE POLICY "Anyone can view threads" 
ON public.threads 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can create their own threads" ON public.threads;
CREATE POLICY "Users can create their own threads" 
ON public.threads 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own threads" ON public.threads;
CREATE POLICY "Users can update their own threads" 
ON public.threads 
FOR UPDATE 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own threads" ON public.threads;
CREATE POLICY "Users can delete their own threads" 
ON public.threads 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Create or replace policies for thread_replies
DROP POLICY IF EXISTS "Anyone can view thread replies" ON public.thread_replies;
CREATE POLICY "Anyone can view thread replies" 
ON public.thread_replies 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can create replies" ON public.thread_replies;
CREATE POLICY "Users can create replies" 
ON public.thread_replies 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Create or replace policies for thread_likes
DROP POLICY IF EXISTS "Anyone can view thread likes" ON public.thread_likes;
CREATE POLICY "Anyone can view thread likes" 
ON public.thread_likes 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can manage their own likes" ON public.thread_likes;
CREATE POLICY "Users can manage their own likes" 
ON public.thread_likes 
FOR ALL 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Create or replace policies for chat_requests
DROP POLICY IF EXISTS "Users can view their chat requests" ON public.chat_requests;
CREATE POLICY "Users can view their chat requests" 
ON public.chat_requests 
FOR SELECT 
USING (auth.uid()::text = sender_id OR auth.uid()::text = recipient_id);

DROP POLICY IF EXISTS "Users can create chat requests" ON public.chat_requests;
CREATE POLICY "Users can create chat requests" 
ON public.chat_requests 
FOR INSERT 
WITH CHECK (auth.uid()::text = sender_id);

DROP POLICY IF EXISTS "Recipients can update chat requests" ON public.chat_requests;
CREATE POLICY "Recipients can update chat requests" 
ON public.chat_requests 
FOR UPDATE 
USING (auth.uid()::text = recipient_id);