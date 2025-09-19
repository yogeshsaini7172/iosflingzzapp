-- Fix thread creation by creating a database function that bypasses RLS issues
-- This function will be called by the edge function with service role privileges

-- Create function to create thread as user (bypasses RLS)
CREATE OR REPLACE FUNCTION create_thread_as_user(
    p_user_id TEXT,
    p_content TEXT
) RETURNS TABLE (
    id UUID,
    user_id TEXT,
    content TEXT,
    likes_count INTEGER,
    replies_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER -- This allows the function to run with the privileges of the function owner
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert the thread directly (bypasses RLS because of SECURITY DEFINER)
    RETURN QUERY
    INSERT INTO public.threads (user_id, content)
    VALUES (p_user_id, p_content)
    RETURNING 
        threads.id,
        threads.user_id,
        threads.content,
        threads.likes_count,
        threads.replies_count,
        threads.created_at,
        threads.updated_at;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION create_thread_as_user(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_thread_as_user(TEXT, TEXT) TO service_role;

-- Create similar function for thread replies
CREATE OR REPLACE FUNCTION create_thread_reply_as_user(
    p_thread_id UUID,
    p_user_id TEXT,
    p_content TEXT
) RETURNS TABLE (
    id UUID,
    thread_id UUID,
    user_id TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert the reply directly (bypasses RLS)
    RETURN QUERY
    INSERT INTO public.thread_replies (thread_id, user_id, content)
    VALUES (p_thread_id, p_user_id, p_content)
    RETURNING 
        thread_replies.id,
        thread_replies.thread_id,
        thread_replies.user_id,
        thread_replies.content,
        thread_replies.created_at;
        
    -- Update the replies count on the parent thread
    UPDATE public.threads 
    SET replies_count = replies_count + 1,
        updated_at = now()
    WHERE threads.id = p_thread_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_thread_reply_as_user(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_thread_reply_as_user(UUID, TEXT, TEXT) TO service_role;
