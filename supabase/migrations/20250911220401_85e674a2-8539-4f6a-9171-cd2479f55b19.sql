-- Insert missing QCS entry for your user (without total_score as it's generated)
INSERT INTO qcs (user_id, profile_score, college_tier, personality_depth, behavior_score, created_at, updated_at)
VALUES (
  'mxXeF0pFDTTP9VgWASRTPvAH4qv2',
  45,  -- Based on profile completeness and quality
  15,  -- JNU/IIT tier score 
  8,   -- Basic personality data available
  100, -- Default behavior score
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  profile_score = EXCLUDED.profile_score,
  college_tier = EXCLUDED.college_tier,
  personality_depth = EXCLUDED.personality_depth,
  behavior_score = EXCLUDED.behavior_score,
  updated_at = NOW();