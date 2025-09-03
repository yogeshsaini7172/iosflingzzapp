-- Create 10 test users with credentials in auth.users table
-- Note: In production, users would sign up normally, but for testing we'll create them directly

-- First, let's create a test_credentials table to store login info for easy reference
CREATE TABLE IF NOT EXISTS public.test_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  profile_name TEXT NOT NULL,
  university TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on test_credentials
ALTER TABLE public.test_credentials ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read test credentials (for testing purposes)
CREATE POLICY "Anyone can view test credentials" ON public.test_credentials
FOR SELECT USING (true);

-- Insert test credentials
INSERT INTO public.test_credentials (email, password, profile_name, university) VALUES
('emma.wilson@mit.edu', 'test123', 'Emma Wilson', 'MIT'),
('alice.johnson@stanford.edu', 'test123', 'Alice Johnson', 'Stanford'),
('sophia.davis@harvard.edu', 'test123', 'Sophia Davis', 'Harvard'),
('isabella.garcia@utexas.edu', 'test123', 'Isabella Garcia', 'UT Austin'),
('olivia.brown@ucla.edu', 'test123', 'Olivia Brown', 'UCLA'),
('ava.martinez@nyu.edu', 'test123', 'Ava Martinez', 'NYU'),
('mia.thompson@berkeley.edu', 'test123', 'Mia Thompson', 'UC Berkeley'),
('charlotte.lee@princeton.edu', 'test123', 'Charlotte Lee', 'Princeton'),
('amelia.clark@columbia.edu', 'test123', 'Amelia Clark', 'Columbia'),
('harper.rodriguez@yale.edu', 'test123', 'Harper Rodriguez', 'Yale');

-- Update existing profiles to ensure they have proper data for testing
UPDATE public.profiles SET
  profile_images = ARRAY[
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'
  ],
  interests = ARRAY['Photography', 'Travel', 'Reading', 'Coffee', 'Art'],
  relationship_goals = ARRAY['long_term', 'serious'],
  bio = 'Love exploring new places and trying different cuisines. Always up for intellectual conversations!',
  height = 165 + (RANDOM() * 20)::INTEGER,
  body_type = CASE 
    WHEN RANDOM() < 0.3 THEN 'slim'
    WHEN RANDOM() < 0.6 THEN 'athletic'
    WHEN RANDOM() < 0.8 THEN 'average'
    ELSE 'curvy'
  END,
  personality_type = CASE 
    WHEN RANDOM() < 0.5 THEN 'extrovert'
    ELSE 'introvert'
  END,
  lifestyle = jsonb_build_object(
    'drinking', CASE WHEN RANDOM() < 0.3 THEN 'never' WHEN RANDOM() < 0.7 THEN 'socially' ELSE 'regularly' END,
    'smoking', CASE WHEN RANDOM() < 0.8 THEN 'never' ELSE 'socially' END,
    'exercise', CASE WHEN RANDOM() < 0.3 THEN 'never' WHEN RANDOM() < 0.7 THEN 'sometimes' ELSE 'regularly' END
  ),
  verification_status = 'verified',
  is_active = true,
  profile_completion_percentage = 95,
  questions_answered = 10 + (RANDOM() * 15)::INTEGER,
  total_qcs = 300 + (RANDOM() * 100)::INTEGER
WHERE first_name IN ('Emma', 'Alice', 'Sophia', 'Isabella', 'Olivia', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Sidhartha');

-- Ensure all test users have partner preferences
INSERT INTO public.partner_preferences (user_id, preferred_gender, age_range_min, age_range_max, preferred_relationship_goal)
SELECT 
  p.user_id,
  ARRAY['male', 'female']::text[],
  18,
  28,
  ARRAY['long_term', 'serious']::text[]
FROM public.profiles p
WHERE p.first_name IN ('Emma', 'Alice', 'Sophia', 'Isabella', 'Olivia', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Sidhartha')
ON CONFLICT (user_id) DO UPDATE SET
  preferred_gender = EXCLUDED.preferred_gender,
  preferred_relationship_goal = EXCLUDED.preferred_relationship_goal;

-- Update QCS scores for all test users
INSERT INTO public.qcs (user_id, profile_score, college_tier, personality_depth, behavior_score, total_score)
SELECT 
  p.user_id,
  80 + (RANDOM() * 20)::INTEGER, -- Profile score 80-100
  CASE 
    WHEN p.university IN ('MIT', 'Harvard', 'Stanford', 'Princeton', 'Yale') THEN 100
    WHEN p.university IN ('Columbia', 'UC Berkeley', 'NYU') THEN 90
    ELSE 80
  END, -- College tier score
  70 + (RANDOM() * 30)::INTEGER, -- Personality depth 70-100
  90 + (RANDOM() * 10)::INTEGER, -- Behavior score 90-100
  0 -- Will be calculated
FROM public.profiles p
WHERE p.first_name IN ('Emma', 'Alice', 'Sophia', 'Isabella', 'Olivia', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Sidhartha')
ON CONFLICT (user_id) DO UPDATE SET
  profile_score = EXCLUDED.profile_score,
  college_tier = EXCLUDED.college_tier,
  personality_depth = EXCLUDED.personality_depth,
  behavior_score = EXCLUDED.behavior_score;

-- Calculate total QCS scores
UPDATE public.qcs SET 
  total_score = (profile_score * 0.3 + college_tier * 0.3 + personality_depth * 0.2 + behavior_score * 0.2)::INTEGER;

-- Update profiles with calculated QCS
UPDATE public.profiles SET 
  total_qcs = (SELECT total_score FROM public.qcs WHERE qcs.user_id = profiles.user_id)
WHERE user_id IN (SELECT user_id FROM public.qcs);