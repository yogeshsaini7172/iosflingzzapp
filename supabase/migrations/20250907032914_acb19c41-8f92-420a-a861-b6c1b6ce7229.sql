-- Create threads table for campus discussions
CREATE TABLE public.threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 280),
  likes_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on threads
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- Create policies for threads
CREATE POLICY "Anyone can view threads" 
ON public.threads 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own threads" 
ON public.threads 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own threads" 
ON public.threads 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own threads" 
ON public.threads 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Create thread_replies table
CREATE TABLE public.thread_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 280),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on thread_replies
ALTER TABLE public.thread_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for thread_replies
CREATE POLICY "Anyone can view thread replies" 
ON public.thread_replies 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create replies" 
ON public.thread_replies 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Create thread_likes table
CREATE TABLE public.thread_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

-- Enable RLS on thread_likes
ALTER TABLE public.thread_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for thread_likes
CREATE POLICY "Anyone can view thread likes" 
ON public.thread_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own likes" 
ON public.thread_likes 
FOR ALL 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Create chat_requests table for compatibility-based chat requests
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

-- Enable RLS on chat_requests
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_requests
CREATE POLICY "Users can view their chat requests" 
ON public.chat_requests 
FOR SELECT 
USING (auth.uid()::text = sender_id OR auth.uid()::text = recipient_id);

CREATE POLICY "Users can create chat requests" 
ON public.chat_requests 
FOR INSERT 
WITH CHECK (auth.uid()::text = sender_id);

CREATE POLICY "Recipients can update chat requests" 
ON public.chat_requests 
FOR UPDATE 
USING (auth.uid()::text = recipient_id);

-- Create triggers to update counts
CREATE OR REPLACE FUNCTION public.update_thread_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'thread_replies' THEN
      UPDATE public.threads 
      SET replies_count = replies_count + 1,
          updated_at = now()
      WHERE id = NEW.thread_id;
    ELSIF TG_TABLE_NAME = 'thread_likes' THEN
      UPDATE public.threads 
      SET likes_count = likes_count + 1,
          updated_at = now()
      WHERE id = NEW.thread_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'thread_replies' THEN
      UPDATE public.threads 
      SET replies_count = replies_count - 1,
          updated_at = now()
      WHERE id = OLD.thread_id;
    ELSIF TG_TABLE_NAME = 'thread_likes' THEN
      UPDATE public.threads 
      SET likes_count = likes_count - 1,
          updated_at = now()
      WHERE id = OLD.thread_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_thread_replies_count
  AFTER INSERT OR DELETE ON public.thread_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_thread_counts();

CREATE TRIGGER update_thread_likes_count
  AFTER INSERT OR DELETE ON public.thread_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_thread_counts();

-- Create trigger for updated_at on threads
CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on chat_requests
CREATE TRIGGER update_chat_requests_updated_at
  BEFORE UPDATE ON public.chat_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();