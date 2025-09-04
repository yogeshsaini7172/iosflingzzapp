-- Update existing profiles with sample profile images and better data for testing
UPDATE profiles SET 
  profile_images = ARRAY[
    CASE 
      WHEN gender = 'female' THEN 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'
      ELSE 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    END,
    CASE 
      WHEN gender = 'female' THEN 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400' 
      ELSE 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
    END,
    CASE 
      WHEN gender = 'female' THEN 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
      ELSE 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'  
    END
  ],
  bio = CASE 
    WHEN first_name = 'Andrew' THEN 'Software engineer passionate about AI and innovation. Love hiking, coffee, and meaningful conversations.'
    WHEN first_name = 'Tony' THEN 'Creative designer with a love for art and music. Always exploring new places and cultures.'
    WHEN first_name = 'Gabriel' THEN 'Fitness enthusiast and entrepreneur. Building the future one day at a time.'
    WHEN first_name = 'Jennifer' THEN 'Psychology student fascinated by human behavior. Love books, travel, and deep conversations.'
    WHEN first_name = 'Gregory' THEN 'Music producer and philosopher. Seeking authentic connections and shared adventures.'
    WHEN first_name = 'Dakota' THEN 'Environmental scientist fighting climate change. Love nature, photography, and sustainability.'
    WHEN first_name = 'Ashlee' THEN 'Marketing professional with a creative soul. Passionate about storytelling and authentic brands.'
    WHEN first_name = 'Kerry' THEN 'Medical student dedicated to helping others. Love cooking, yoga, and volunteering.'
    WHEN first_name = 'Vincent' THEN 'Architect designing sustainable spaces. Fascinated by urban planning and green technology.'
    WHEN first_name = 'David' THEN 'Data scientist and tech innovator. Love solving complex problems and building solutions.'
    ELSE 'Passionate about life and looking for genuine connections. Always up for new adventures and experiences.'
  END,
  interests = CASE 
    WHEN gender = 'male' THEN ARRAY['Technology', 'Fitness', 'Travel', 'Music', 'Entrepreneurship', 'Gaming']
    ELSE ARRAY['Art', 'Photography', 'Travel', 'Books', 'Yoga', 'Cooking', 'Nature']
  END,
  relationship_goals = ARRAY['Long-term relationship', 'Marriage', 'Companionship'],
  is_active = true,
  is_profile_public = true,
  verification_status = 'verified',
  profile_completion_percentage = 95 + (RANDOM() * 5)::INTEGER,
  total_qcs = 300 + (RANDOM() * 200)::INTEGER
WHERE profile_images IS NULL OR array_length(profile_images, 1) IS NULL;

-- Ensure all profiles have partner preferences
INSERT INTO partner_preferences (user_id, preferred_gender, age_range_min, age_range_max, preferred_relationship_goal)
SELECT 
  p.user_id,
  CASE 
    WHEN p.gender = 'male' THEN ARRAY['female']::text[]
    WHEN p.gender = 'female' THEN ARRAY['male']::text[] 
    ELSE ARRAY['male', 'female']::text[]
  END,
  22,
  35,
  ARRAY['Long-term relationship', 'Marriage']::text[]
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM partner_preferences pp WHERE pp.user_id = p.user_id
);

-- Update QCS scores for all profiles
UPDATE profiles SET 
  total_qcs = (
    SELECT COALESCE(qcs.total_score, 300 + (RANDOM() * 200)::INTEGER)
    FROM qcs 
    WHERE qcs.user_id = profiles.user_id
  )
WHERE total_qcs IS NULL OR total_qcs = 0;