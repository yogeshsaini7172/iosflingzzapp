-- Normalize partner preferences for both accounts to ensure matching
UPDATE partner_preferences 
SET 
  preferred_face_types = ARRAY['round'],
  preferred_personality_traits = ARRAY['adventurous']
WHERE user_id IN ('NEqqHKfdwEaRcpK8a0zcwPcOl9E3','ICcBIGUR7mSw0DvXUxp1DpjyAvK2');