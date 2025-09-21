-- Find and fix remaining security issues

-- Fix any remaining functions that might need search_path
-- Let's check for any functions we might have missed
ALTER FUNCTION public.increment_reports_count(uuid) SET search_path = 'public';

-- Check for any views with SECURITY DEFINER and fix them
-- Sometimes there might be hidden system views, let's make sure we catch them all
DO $$ 
DECLARE
    view_name TEXT;
BEGIN
    -- Find any views with SECURITY DEFINER
    FOR view_name IN 
        SELECT schemaname||'.'||viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%security definer%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || view_name || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', view_name;
    END LOOP;
END $$;

-- Recreate chat_rooms_with_details view properly (if it was dropped)
CREATE OR REPLACE VIEW public.chat_rooms_with_details AS
SELECT 
  cr.id,
  cr.match_id,
  cr.created_at,
  cr.updated_at,
  cr.last_message,
  cr.last_message_time,
  cr.user1_id,
  cr.user2_id,
  p1.first_name as user1_first_name,
  p1.last_name as user1_last_name,
  p2.first_name as user2_first_name,
  p2.last_name as user2_last_name
FROM chat_rooms cr
LEFT JOIN profiles p1 ON cr.user1_id = p1.firebase_uid OR cr.user1_id = p1.user_id
LEFT JOIN profiles p2 ON cr.user2_id = p2.firebase_uid OR cr.user2_id = p2.user_id;