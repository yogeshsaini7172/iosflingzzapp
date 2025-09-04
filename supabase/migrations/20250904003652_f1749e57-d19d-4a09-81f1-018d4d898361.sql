-- Update existing profiles with sample data (only for existing valid profiles)
UPDATE profiles SET 
  profile_images = CASE 
    WHEN profile_images IS NULL OR array_length(profile_images, 1) IS NULL THEN
      ARRAY[
        CASE 
          WHEN gender = 'female' THEN 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'
          ELSE 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
        END,
        CASE 
          WHEN gender = 'female' THEN 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400' 
          ELSE 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
        END
      ]
    ELSE profile_images
  END,
  bio = CASE 
    WHEN bio IS NULL OR bio = '' THEN 'Passionate about life and looking for genuine connections. Always up for new adventures and experiences!'
    ELSE bio
  END,
  interests = CASE 
    WHEN interests IS NULL OR array_length(interests, 1) IS NULL THEN
      CASE 
        WHEN gender = 'male' THEN ARRAY['Technology', 'Fitness', 'Travel', 'Music']
        ELSE ARRAY['Art', 'Photography', 'Travel', 'Books', 'Yoga']
      END
    ELSE interests
  END,
  relationship_goals = CASE 
    WHEN relationship_goals IS NULL OR array_length(relationship_goals, 1) IS NULL THEN 
      ARRAY['Long-term relationship', 'Companionship']
    ELSE relationship_goals
  END,
  is_active = COALESCE(is_active, true),
  is_profile_public = COALESCE(is_profile_public, true),
  verification_status = COALESCE(verification_status, 'verified'),
  profile_completion_percentage = COALESCE(profile_completion_percentage, 85),
  total_qcs = CASE 
    WHEN total_qcs IS NULL OR total_qcs = 0 THEN 350 + (RANDOM() * 150)::INTEGER
    ELSE total_qcs
  END
WHERE user_id IN (
  SELECT user_id FROM profiles WHERE first_name IS NOT NULL
);