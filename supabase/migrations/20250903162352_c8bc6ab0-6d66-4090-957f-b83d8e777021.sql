-- Create test user profiles for pairing verification
INSERT INTO public.profiles (
  user_id, first_name, last_name, email, date_of_birth, gender, university, 
  bio, interests, relationship_goals, personality_type, humor_type, love_language,
  subscription_tier, verification_status, is_profile_public, profile_completion_percentage,
  year_of_study, major, height, body_type, college_tier
) VALUES 
  -- Female users (5)
  ('11111111-1111-1111-1111-111111111001', 'Alice', 'Johnson', 'alice.johnson@test.com', '2002-03-15', 'female', 'Stanford University', 
   'Psychology major who loves hiking and coffee dates. Looking for genuine connections!', 
   ARRAY['hiking', 'coffee', 'psychology', 'reading', 'yoga'], 
   ARRAY['serious_relationship', 'marriage'], 'INFJ', 'witty', 'quality_time', 'free', 'verified', true, 85,
   3, 'Psychology', 165, 'athletic', 'tier1'),
   
  ('11111111-1111-1111-1111-111111111002', 'Emma', 'Wilson', 'emma.wilson@test.com', '2001-07-22', 'female', 'MIT', 
   'Computer Science student passionate about AI and sustainability. Let''s build something amazing together!', 
   ARRAY['programming', 'sustainability', 'AI', 'gaming', 'music'], 
   ARRAY['serious_relationship', 'companionship'], 'INTJ', 'sarcastic', 'acts_of_service', 'premium', 'verified', true, 90,
   4, 'Computer Science', 170, 'slim', 'tier1'),
   
  ('11111111-1111-1111-1111-111111111003', 'Sophia', 'Davis', 'sophia.davis@test.com', '2003-01-10', 'female', 'Harvard University', 
   'Pre-med student with a passion for helping others. Love dancing and trying new cuisines!', 
   ARRAY['medicine', 'dancing', 'cooking', 'volunteering', 'travel'], 
   ARRAY['serious_relationship', 'marriage'], 'ENFJ', 'playful', 'physical_touch', 'free', 'verified', true, 80,
   2, 'Biology', 160, 'petite', 'tier1'),
   
  ('11111111-1111-1111-1111-111111111004', 'Olivia', 'Brown', 'olivia.brown@test.com', '2002-09-05', 'female', 'UCLA', 
   'Art major who sees beauty in everything. Looking for someone to explore galleries and create memories with!', 
   ARRAY['art', 'photography', 'museums', 'indie_music', 'fashion'], 
   ARRAY['dating', 'companionship'], 'ISFP', 'quirky', 'gift_giving', 'free', 'pending', true, 75,
   3, 'Fine Arts', 168, 'curvy', 'tier1'),
   
  ('11111111-1111-1111-1111-111111111005', 'Isabella', 'Garcia', 'isabella.garcia@test.com', '2001-12-18', 'female', 'University of Texas', 
   'Business major with entrepreneurial dreams. Love fitness, good food, and meaningful conversations!', 
   ARRAY['business', 'fitness', 'entrepreneurship', 'food', 'networking'], 
   ARRAY['serious_relationship', 'marriage'], 'ESTJ', 'confident', 'words_of_affirmation', 'premium', 'verified', true, 88,
   4, 'Business Administration', 172, 'athletic', 'tier2'),

  -- Male users (5)
  ('11111111-1111-1111-1111-111111111006', 'James', 'Smith', 'james.smith@test.com', '2001-04-12', 'male', 'Stanford University', 
   'Engineering student who loves problem-solving and outdoor adventures. Seeking a genuine connection!', 
   ARRAY['engineering', 'rock_climbing', 'technology', 'camping', 'board_games'], 
   ARRAY['serious_relationship', 'marriage'], 'ENTP', 'witty', 'quality_time', 'free', 'verified', true, 82,
   4, 'Mechanical Engineering', 180, 'athletic', 'tier1'),
   
  ('11111111-1111-1111-1111-111111111007', 'Michael', 'Johnson', 'michael.johnson@test.com', '2002-11-08', 'male', 'MIT', 
   'Physics major fascinated by the universe. Love stargazing, playing guitar, and deep conversations!', 
   ARRAY['physics', 'astronomy', 'guitar', 'philosophy', 'science'], 
   ARRAY['serious_relationship', 'companionship'], 'INFP', 'thoughtful', 'physical_touch', 'premium', 'verified', true, 87,
   3, 'Physics', 175, 'slim', 'tier1'),
   
  ('11111111-1111-1111-1111-111111111008', 'William', 'Davis', 'william.davis@test.com', '2003-06-25', 'male', 'Harvard University', 
   'Economics major with a passion for finance and social impact. Enjoy tennis, reading, and trying new restaurants!', 
   ARRAY['economics', 'finance', 'tennis', 'reading', 'social_impact'], 
   ARRAY['dating', 'serious_relationship'], 'ENTJ', 'charming', 'acts_of_service', 'free', 'verified', true, 79,
   2, 'Economics', 183, 'athletic', 'tier1'),
   
  ('11111111-1111-1111-1111-111111111009', 'Alexander', 'Wilson', 'alexander.wilson@test.com', '2001-08-30', 'male', 'UCLA', 
   'Film major with creative ambitions. Love movies, photography, and exploring LA. Looking for my co-star in life!', 
   ARRAY['film', 'photography', 'movies', 'creative_writing', 'travel'], 
   ARRAY['dating', 'companionship'], 'ISFP', 'creative', 'gift_giving', 'free', 'pending', true, 76,
   4, 'Film Studies', 178, 'slim', 'tier1'),
   
  ('11111111-1111-1111-1111-111111111010', 'Benjamin', 'Miller', 'benjamin.miller@test.com', '2002-02-14', 'male', 'University of Texas', 
   'Computer Science major and fitness enthusiast. Love coding, working out, and good music. Let''s code our love story!', 
   ARRAY['programming', 'fitness', 'music', 'gaming', 'technology'], 
   ARRAY['serious_relationship', 'marriage'], 'ISTJ', 'reliable', 'words_of_affirmation', 'premium', 'verified', true, 84,
   3, 'Computer Science', 185, 'muscular', 'tier2')

ON CONFLICT (user_id) DO NOTHING;

-- Initialize QCS scores for test users (excluding total_score as it's generated)
INSERT INTO public.qcs (user_id, profile_score, college_tier, personality_depth, behavior_score)
VALUES 
  ('11111111-1111-1111-1111-111111111001', 85, 95, 80, 100),
  ('11111111-1111-1111-1111-111111111002', 90, 95, 88, 100),
  ('11111111-1111-1111-1111-111111111003', 80, 95, 85, 100),
  ('11111111-1111-1111-1111-111111111004', 75, 95, 78, 100),
  ('11111111-1111-1111-1111-111111111005', 88, 80, 82, 100),
  ('11111111-1111-1111-1111-111111111006', 82, 95, 85, 100),
  ('11111111-1111-1111-1111-111111111007', 87, 95, 90, 100),
  ('11111111-1111-1111-1111-111111111008', 79, 95, 82, 100),
  ('11111111-1111-1111-1111-111111111009', 76, 95, 78, 100),
  ('11111111-1111-1111-1111-111111111010', 84, 80, 85, 100)

ON CONFLICT (user_id) DO NOTHING;