-- Create user profile for Sidhartha to test pairing functionality
INSERT INTO public.profiles (
  user_id, first_name, last_name, email, date_of_birth, gender, university, 
  bio, interests, relationship_goals, personality_type, humor_type, love_language,
  subscription_tier, verification_status, is_profile_public, profile_completion_percentage,
  year_of_study, major, height, body_type, college_tier
) VALUES 
  ('22222222-2222-2222-2222-222222222001', 'Sidhartha', 'Kumar', 'sidhartha.kumar@test.com', '2001-08-15', 'male', 'IIT Delhi', 
   'Computer Science student passionate about AI and entrepreneurship. Love coding, traveling, and meeting new people!', 
   ARRAY['programming', 'AI', 'entrepreneurship', 'travel', 'music', 'fitness'], 
   ARRAY['serious_relationship', 'companionship'], 'ENTJ', 'witty', 'quality_time', 'premium', 'verified', true, 92,
   4, 'Computer Science & Engineering', 175, 'athletic', 'tier1')

ON CONFLICT (user_id) DO NOTHING;

-- Create partner preferences for Sidhartha (looking for females)
INSERT INTO public.partner_preferences (user_id, preferred_gender, age_range_min, age_range_max, preferred_relationship_goal)
VALUES 
  ('22222222-2222-2222-2222-222222222001', ARRAY['female'], 19, 26, ARRAY['serious_relationship', 'companionship'])

ON CONFLICT (user_id) DO NOTHING;

-- Initialize QCS scores for Sidhartha
INSERT INTO public.qcs (user_id, profile_score, college_tier, personality_depth, behavior_score)
VALUES 
  ('22222222-2222-2222-2222-222222222001', 92, 98, 85, 100)

ON CONFLICT (user_id) DO NOTHING;