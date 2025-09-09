-- Create a trigger function that creates notifications when someone likes another user
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create notification for right swipes (likes)
  IF NEW.direction = 'right' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    )
    SELECT 
      NEW.target_user_id,
      'new_like',
      'Someone liked you! 💖',
      COALESCE(p.first_name, 'Someone') || ' liked your profile',
      jsonb_build_object('liker_id', NEW.user_id),
      NOW()
    FROM profiles p
    WHERE p.user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on enhanced_swipes table
CREATE TRIGGER trigger_create_like_notification
  AFTER INSERT ON enhanced_swipes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();