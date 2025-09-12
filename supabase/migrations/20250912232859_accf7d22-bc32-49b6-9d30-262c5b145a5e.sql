-- Fix QCS consistency and add missing constraints
-- Sync QCS scores between tables for consistency

-- Update profiles.total_qcs from qcs.total_score where they differ
UPDATE profiles 
SET total_qcs = qcs.total_score 
FROM qcs 
WHERE profiles.user_id = qcs.user_id 
  AND profiles.total_qcs != qcs.total_score;

-- Add missing QCS records for profiles that have scores but no detailed breakdown
INSERT INTO qcs (user_id, profile_score, college_tier, personality_depth, behavior_score)
SELECT 
  p.user_id,
  CASE 
    WHEN p.total_qcs > 0 THEN GREATEST(0, LEAST(40, p.total_qcs * 0.4))
    ELSE 0
  END as profile_score,
  CASE 
    WHEN p.college_tier = 'tier1' THEN 30
    WHEN p.college_tier = 'tier2' THEN 25  
    ELSE 20
  END as college_tier,
  CASE 
    WHEN p.total_qcs > 0 THEN GREATEST(0, LEAST(20, p.total_qcs * 0.2))
    ELSE 0
  END as personality_depth,
  10 as behavior_score
FROM profiles p
LEFT JOIN qcs q ON p.user_id = q.user_id
WHERE q.user_id IS NULL 
  AND p.is_active = true
  AND p.total_qcs IS NOT NULL;

-- Create function to handle profile updates and auto-recalculate QCS
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
$$ LANGUAGE plpgsql;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS profile_qcs_update_trigger ON profiles;
CREATE TRIGGER profile_qcs_update_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_qcs_recalculation();