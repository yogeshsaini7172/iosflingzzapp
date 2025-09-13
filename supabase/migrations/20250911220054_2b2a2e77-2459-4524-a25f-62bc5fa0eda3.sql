-- Insert missing QCS entry for your user
INSERT INTO qcs (user_id, profile_score, college_tier, personality_depth, behavior_score, total_score, created_at, updated_at)
VALUES (
  'mxXeF0pFDTTP9VgWASRTPvAH4qv2',
  45,  -- Based on profile completeness
  15,  -- JNU/IIT tier score
  8,   -- Basic personality data
  100, -- Default behavior score
  71,  -- Match existing total_qcs
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  profile_score = EXCLUDED.profile_score,
  college_tier = EXCLUDED.college_tier,
  personality_depth = EXCLUDED.personality_depth,
  behavior_score = EXCLUDED.behavior_score,
  total_score = EXCLUDED.total_score,
  updated_at = NOW();