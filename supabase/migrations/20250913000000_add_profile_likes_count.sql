-- Add likes_count column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create function to update profile likes count
CREATE OR REPLACE FUNCTION public.update_profile_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When someone likes a profile, increment the count
    IF NEW.direction = 'right' THEN
      UPDATE public.profiles 
      SET likes_count = likes_count + 1
      WHERE firebase_uid = NEW.target_user_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- When a like is removed (either by unliking or by creating a match)
    IF OLD.direction = 'right' THEN
      UPDATE public.profiles 
      SET likes_count = GREATEST(likes_count - 1, 0)
      WHERE firebase_uid = OLD.target_user_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on enhanced_swipes table
DROP TRIGGER IF EXISTS trigger_update_profile_likes_count ON public.enhanced_swipes;
CREATE TRIGGER trigger_update_profile_likes_count
  AFTER INSERT OR DELETE ON public.enhanced_swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_likes_count();

-- Create function to handle removal of likes when match is created
CREATE OR REPLACE FUNCTION public.update_likes_on_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When a match is created, update likes count for both users
    UPDATE public.profiles 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE firebase_uid IN (NEW.user1_id, NEW.user2_id);
    
    -- Delete the users from each other's "who liked me" list since they're now matched
    DELETE FROM public.enhanced_swipes
    WHERE (user_id = NEW.user1_id AND target_user_id = NEW.user2_id)
       OR (user_id = NEW.user2_id AND target_user_id = NEW.user1_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on enhanced_matches table
DROP TRIGGER IF EXISTS trigger_update_likes_on_match ON public.enhanced_matches;
CREATE TRIGGER trigger_update_likes_on_match
  AFTER INSERT ON public.enhanced_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_likes_on_match();