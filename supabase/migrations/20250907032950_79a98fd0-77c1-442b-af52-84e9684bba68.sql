-- Fix security issue: Set proper search path for update_thread_counts function
CREATE OR REPLACE FUNCTION public.update_thread_counts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;