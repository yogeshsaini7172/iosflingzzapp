-- Update both user profiles to have matching face_type and personality_type for testing

-- Update first user (avanit kumari) to ensure consistent data
UPDATE profiles 
SET 
  face_type = 'round',
  personality_type = 'adventurous',
  qualities = jsonb_set(
    jsonb_set(qualities, '{face_type}', '"round"'::jsonb),
    '{personality_type}', '"adventurous"'::jsonb
  ),
  requirements = jsonb_set(
    jsonb_set(requirements, '{preferred_face_types}', '["round"]'::jsonb),
    '{preferred_personality_traits}', '["adventurous"]'::jsonb
  )
WHERE firebase_uid = 'ICcBIGUR7mSw0DvXUxp1DpjyAvK2';

-- Update second user (sidhartha nayak) to match the first user  
UPDATE profiles 
SET 
  face_type = 'round',
  personality_type = 'adventurous',
  qualities = jsonb_set(
    jsonb_set(qualities, '{face_type}', '"round"'::jsonb),
    '{personality_type}', '"adventurous"'::jsonb
  ),
  requirements = jsonb_set(
    jsonb_set(requirements, '{preferred_face_types}', '["round"]'::jsonb),
    '{preferred_personality_traits}', '["adventurous"]'::jsonb
  )
WHERE firebase_uid = 'NEqqHKfdwEaRcpK8a0zcwPcOl9E3';