-- Insert test users for pairing verification
-- Note: These are test users with fake emails for development/testing purposes

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alice.johnson@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "Alice", "last_name": "Johnson"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emma.wilson@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "Emma", "last_name": "Wilson"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sophia.davis@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "Sophia", "last_name": "Davis"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'olivia.brown@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "Olivia", "last_name": "Brown"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'isabella.garcia@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "Isabella", "last_name": "Garcia"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'james.smith@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "James", "last_name": "Smith"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'michael.johnson@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "Michael", "last_name": "Johnson"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'william.davis@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "William", "last_name": "Davis"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alexander.wilson@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "Alexander", "last_name": "Wilson"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'benjamin.miller@test.com', '$2a$10$placeholder', NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "Benjamin", "last_name": "Miller"}', false, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);

-- Insert corresponding profiles for test users
INSERT INTO public.profiles (
  user_id, first_name, last_name, email, date_of_birth, gender, university, 
  bio, interests, relationship_goals, personality_type, humor_type, love_language,
  subscription_tier, verification_status, is_profile_public, profile_completion_percentage,
  year_of_study, major, height, body_type, college_tier
) VALUES 
  -- Female users
  ('550e8400-e29b-41d4-a716-446655440001', 'Alice', 'Johnson', 'alice.johnson@test.com', '2002-03-15', 'female', 'Stanford University', 
   'Psychology major who loves hiking and coffee dates. Looking for genuine connections!', 
   ARRAY['hiking', 'coffee', 'psychology', 'reading', 'yoga'], 
   ARRAY['serious_relationship', 'marriage'], 'INFJ', 'witty', 'quality_time', 'free', 'verified', true, 85,
   3, 'Psychology', 165, 'athletic', 'tier1'),
   
  ('550e8400-e29b-41d4-a716-446655440002', 'Emma', 'Wilson', 'emma.wilson@test.com', '2001-07-22', 'female', 'MIT', 
   'Computer Science student passionate about AI and sustainability. Lets build something amazing together!', 
   ARRAY['programming', 'sustainability', 'AI', 'gaming', 'music'], 
   ARRAY['serious_relationship', 'companionship'], 'INTJ', 'sarcastic', 'acts_of_service', 'premium', 'verified', true, 90,
   4, 'Computer Science', 170, 'slim', 'tier1'),
   
  ('550e8400-e29b-41d4-a716-446655440003', 'Sophia', 'Davis', 'sophia.davis@test.com', '2003-01-10', 'female', 'Harvard University', 
   'Pre-med student with a passion for helping others. Love dancing and trying new cuisines!', 
   ARRAY['medicine', 'dancing', 'cooking', 'volunteering', 'travel'], 
   ARRAY['serious_relationship', 'marriage'], 'ENFJ', 'playful', 'physical_touch', 'free', 'verified', true, 80,
   2, 'Biology', 160, 'petite', 'tier1'),
   
  ('550e8400-e29b-41d4-a716-446655440004', 'Olivia', 'Brown', 'olivia.brown@test.com', '2002-09-05', 'female', 'UCLA', 
   'Art major who sees beauty in everything. Looking for someone to explore galleries and create memories with!', 
   ARRAY['art', 'photography', 'museums', 'indie_music', 'fashion'], 
   ARRAY['dating', 'companionship'], 'ISFP', 'quirky', 'gift_giving', 'free', 'pending', true, 75,
   3, 'Fine Arts', 168, 'curvy', 'tier1'),
   
  ('550e8400-e29b-41d4-a716-446655440005', 'Isabella', 'Garcia', 'isabella.garcia@test.com', '2001-12-18', 'female', 'University of Texas', 
   'Business major with entrepreneurial dreams. Love fitness, good food, and meaningful conversations!', 
   ARRAY['business', 'fitness', 'entrepreneurship', 'food', 'networking'], 
   ARRAY['serious_relationship', 'marriage'], 'ESTJ', 'confident', 'words_of_affirmation', 'premium', 'verified', true, 88,
   4, 'Business Administration', 172, 'athletic', 'tier2'),

  -- Male users  
  ('550e8400-e29b-41d4-a716-446655440006', 'James', 'Smith', 'james.smith@test.com', '2001-04-12', 'male', 'Stanford University', 
   'Engineering student who loves problem-solving and outdoor adventures. Seeking a genuine connection!', 
   ARRAY['engineering', 'rock_climbing', 'technology', 'camping', 'board_games'], 
   ARRAY['serious_relationship', 'marriage'], 'ENTP', 'witty', 'quality_time', 'free', 'verified', true, 82,
   4, 'Mechanical Engineering', 180, 'athletic', 'tier1'),
   
  ('550e8400-e29b-41d4-a716-446655440007', 'Michael', 'Johnson', 'michael.johnson@test.com', '2002-11-08', 'male', 'MIT', 
   'Physics major fascinated by the universe. Love stargazing, playing guitar, and deep conversations!', 
   ARRAY['physics', 'astronomy', 'guitar', 'philosophy', 'science'], 
   ARRAY['serious_relationship', 'companionship'], 'INFP', 'thoughtful', 'physical_touch', 'premium', 'verified', true, 87,
   3, 'Physics', 175, 'slim', 'tier1'),
   
  ('550e8400-e29b-41d4-a716-446655440008', 'William', 'Davis', 'william.davis@test.com', '2003-06-25', 'male', 'Harvard University', 
   'Economics major with a passion for finance and social impact. Enjoy tennis, reading, and trying new restaurants!', 
   ARRAY['economics', 'finance', 'tennis', 'reading', 'social_impact'], 
   ARRAY['dating', 'serious_relationship'], 'ENTJ', 'charming', 'acts_of_service', 'free', 'verified', true, 79,
   2, 'Economics', 183, 'athletic', 'tier1'),
   
  ('550e8400-e29b-41d4-a716-446655440009', 'Alexander', 'Wilson', 'alexander.wilson@test.com', '2001-08-30', 'male', 'UCLA', 
   'Film major with creative ambitions. Love movies, photography, and exploring LA. Looking for my co-star in life!', 
   ARRAY['film', 'photography', 'movies', 'creative_writing', 'travel'], 
   ARRAY['dating', 'companionship'], 'ISFP', 'creative', 'gift_giving', 'free', 'pending', true, 76,
   4, 'Film Studies', 178, 'slim', 'tier1'),
   
  ('550e8400-e29b-41d4-a716-446655440010', 'Benjamin', 'Miller', 'benjamin.miller@test.com', '2002-02-14', 'male', 'University of Texas', 
   'Computer Science major and fitness enthusiast. Love coding, working out, and good music. Lets code our love story!', 
   ARRAY['programming', 'fitness', 'music', 'gaming', 'technology'], 
   ARRAY['serious_relationship', 'marriage'], 'ISTJ', 'reliable', 'words_of_affirmation', 'premium', 'verified', true, 84,
   3, 'Computer Science', 185, 'muscular', 'tier2');

-- Create partner preferences for each user
INSERT INTO public.partner_preferences (
  user_id, preferred_gender, age_range_min, age_range_max, preferred_relationship_goal
) VALUES 
  -- Female users preferences (looking for males)
  ('550e8400-e29b-41d4-a716-446655440001', ARRAY['male'], 20, 26, ARRAY['serious_relationship', 'marriage']),
  ('550e8400-e29b-41d4-a716-446655440002', ARRAY['male'], 21, 28, ARRAY['serious_relationship', 'companionship']),
  ('550e8400-e29b-41d4-a716-446655440003', ARRAY['male'], 19, 25, ARRAY['serious_relationship', 'marriage']),
  ('550e8400-e29b-41d4-a716-446655440004', ARRAY['male'], 20, 27, ARRAY['dating', 'companionship']),
  ('550e8400-e29b-41d4-a716-446655440005', ARRAY['male'], 22, 30, ARRAY['serious_relationship', 'marriage']),
  
  -- Male users preferences (looking for females)
  ('550e8400-e29b-41d4-a716-446655440006', ARRAY['female'], 19, 25, ARRAY['serious_relationship', 'marriage']),
  ('550e8400-e29b-41d4-a716-446655440007', ARRAY['female'], 20, 26, ARRAY['serious_relationship', 'companionship']),
  ('550e8400-e29b-41d4-a716-446655440008', ARRAY['female'], 18, 24, ARRAY['dating', 'serious_relationship']),
  ('550e8400-e29b-41d4-a716-446655440009', ARRAY['female'], 19, 27, ARRAY['dating', 'companionship']),
  ('550e8400-e29b-41d4-a716-446655440010', ARRAY['female'], 20, 28, ARRAY['serious_relationship', 'marriage']);

-- Initialize QCS scores for better matching
INSERT INTO public.qcs (user_id, profile_score, college_tier, personality_depth, behavior_score, total_score) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 85, 95, 80, 100, 90),
  ('550e8400-e29b-41d4-a716-446655440002', 90, 95, 88, 100, 93),
  ('550e8400-e29b-41d4-a716-446655440003', 80, 95, 85, 100, 90),
  ('550e8400-e29b-41d4-a716-446655440004', 75, 95, 78, 100, 87),
  ('550e8400-e29b-41d4-a716-446655440005', 88, 80, 82, 100, 87),
  ('550e8400-e29b-41d4-a716-446655440006', 82, 95, 85, 100, 90),
  ('550e8400-e29b-41d4-a716-446655440007', 87, 95, 90, 100, 93),
  ('550e8400-e29b-41d4-a716-446655440008', 79, 95, 82, 100, 89),
  ('550e8400-e29b-41d4-a716-446655440009', 76, 95, 78, 100, 87),
  ('550e8400-e29b-41d4-a716-446655440010', 84, 80, 85, 100, 87);