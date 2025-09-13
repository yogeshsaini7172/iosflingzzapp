-- Fix security warning: Set search_path for the trigger function
CREATE OR REPLACE FUNCTION trigger_qcs_recalculation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for significant profile changes
  IF (OLD.bio IS DISTINCT FROM NEW.bio) OR 
     (OLD.profile_images IS DISTINCT FROM NEW.profile_images) OR
     (OLD.body_type IS DISTINCT FROM NEW.body_type) OR
     (OLD.personality_type IS DISTINCT FROM NEW.personality_type) OR
     (OLD.interests IS DISTINCT FROM NEW.interests) THEN
    
    -- Mark for QCS recalculation (could trigger async process)
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;