-- Final attempt to fix remaining security issues

-- Let's check for any views that might have been created with SECURITY DEFINER
-- and recreate them without it

-- Check if there are any materialized views or other views causing issues
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Check for any remaining problematic database objects
    -- Drop and recreate the chat_rooms_with_details view to ensure it doesn't have SECURITY DEFINER
    DROP VIEW IF EXISTS public.chat_rooms_with_details CASCADE;
    
    -- Recreate it as a simple view
    CREATE VIEW public.chat_rooms_with_details AS
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
END $$;

-- Fix any remaining trigger functions that might not have search_path
ALTER FUNCTION public.update_profile_timestamp() SET search_path = 'public';
ALTER FUNCTION public.trigger_qcs_recalculation() SET search_path = 'public';