-- Create test credentials table for easy reference (no foreign keys to auth.users)
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

-- Allow anyone to view test credentials (for testing purposes)
CREATE POLICY "Anyone can view test credentials" ON public.test_credentials
FOR SELECT USING (true);

-- Insert test credentials matching our existing profiles
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
('harper.rodriguez@yale.edu', 'test123', 'Harper Rodriguez', 'Yale'),
('sidhartha@college.edu', 'test123', 'Sidhartha', 'Stanford');

-- Update existing profiles with complete data for testing
UPDATE public.profiles SET
  email = CASE first_name
    WHEN 'Emma' THEN 'emma.wilson@mit.edu'
    WHEN 'Alice' THEN 'alice.johnson@stanford.edu'
    WHEN 'Sophia' THEN 'sophia.davis@harvard.edu'
    WHEN 'Isabella' THEN 'isabella.garcia@utexas.edu'
    WHEN 'Olivia' THEN 'olivia.brown@ucla.edu'
    WHEN 'Ava' THEN 'ava.martinez@nyu.edu'
    WHEN 'Mia' THEN 'mia.thompson@berkeley.edu'
    WHEN 'Charlotte' THEN 'charlotte.lee@princeton.edu'
    WHEN 'Amelia' THEN 'amelia.clark@columbia.edu'
    WHEN 'Harper' THEN 'harper.rodriguez@yale.edu'
    WHEN 'Sidhartha' THEN 'sidhartha@college.edu'
  END,
  profile_images = ARRAY[
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'
  ],
  interests = ARRAY['Photography', 'Travel', 'Reading', 'Coffee', 'Art', 'Music', 'Fitness'],
  relationship_goals = ARRAY['long_term', 'serious'],
  bio = CASE first_name
    WHEN 'Emma' THEN 'CS at MIT. Love coding, coffee, and deep conversations about the future of tech.'
    WHEN 'Alice' THEN 'Psychology major at Stanford. Passionate about understanding human behavior and helping others.'
    WHEN 'Sophia' THEN 'Pre-med at Harvard. Balancing studies with rock climbing and volunteer work.'
    WHEN 'Isabella' THEN 'Business student at UT Austin. Entrepreneur at heart with a love for live music.'
    WHEN 'Olivia' THEN 'Arts major at UCLA. Creative soul who finds beauty in everyday moments.'
    WHEN 'Ava' THEN 'Engineering at NYU. Building the future one project at a time.'
    WHEN 'Mia' THEN 'Environmental Science at Berkeley. Fighting climate change and loving nature.'
    WHEN 'Charlotte' THEN 'Philosophy at Princeton. Deep thinker who loves intellectual debates.'
    WHEN 'Amelia' THEN 'Journalism at Columbia. Storyteller seeking truth in an complex world.'
    WHEN 'Harper' THEN 'Literature at Yale. Words are my passion, stories are my life.'
    WHEN 'Sidhartha' THEN 'Tech entrepreneur and Stanford alumnus. Building innovative solutions.'
  END,
  height = 160 + (RANDOM() * 25)::INTEGER,
  body_type = CASE 
    WHEN RANDOM() < 0.25 THEN 'slim'
    WHEN RANDOM() < 0.5 THEN 'athletic'
    WHEN RANDOM() < 0.75 THEN 'average'
    ELSE 'curvy'
  END,
  personality_type = CASE 
    WHEN RANDOM() < 0.5 THEN 'extrovert'
    ELSE 'introvert'
  END,
  humor_type = CASE 
    WHEN RANDOM() < 0.33 THEN 'witty'
    WHEN RANDOM() < 0.66 THEN 'sarcastic'
    ELSE 'playful'
  END,
  love_language = CASE 
    WHEN RANDOM() < 0.2 THEN 'words_of_affirmation'
    WHEN RANDOM() < 0.4 THEN 'quality_time'
    WHEN RANDOM() < 0.6 THEN 'physical_touch'
    WHEN RANDOM() < 0.8 THEN 'acts_of_service'
    ELSE 'receiving_gifts'
  END,
  lifestyle = jsonb_build_object(
    'drinking', CASE WHEN RANDOM() < 0.3 THEN 'never' WHEN RANDOM() < 0.7 THEN 'socially' ELSE 'regularly' END,
    'smoking', CASE WHEN RANDOM() < 0.8 THEN 'never' ELSE 'socially' END,
    'exercise', CASE WHEN RANDOM() < 0.3 THEN 'never' WHEN RANDOM() < 0.7 THEN 'sometimes' ELSE 'regularly' END,
    'diet', CASE WHEN RANDOM() < 0.7 THEN 'omnivore' WHEN RANDOM() < 0.9 THEN 'vegetarian' ELSE 'vegan' END
  ),
  verification_status = 'verified',
  is_active = true,
  profile_completion_percentage = 95,
  questions_answered = 15 + (RANDOM() * 10)::INTEGER,
  college_tier = CASE university
    WHEN 'MIT' THEN 'tier1'
    WHEN 'Harvard' THEN 'tier1'
    WHEN 'Stanford' THEN 'tier1'
    WHEN 'Princeton' THEN 'tier1'
    WHEN 'Yale' THEN 'tier1'
    WHEN 'Columbia' THEN 'tier2'
    WHEN 'UC Berkeley' THEN 'tier2'
    WHEN 'NYU' THEN 'tier2'
    ELSE 'tier3'
  END
WHERE first_name IN ('Emma', 'Alice', 'Sophia', 'Isabella', 'Olivia', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Sidhartha');