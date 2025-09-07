-- Add demo profile images data to existing profiles to fix photo loading issues
UPDATE profiles 
SET profile_images = ARRAY[
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'
]
WHERE user_id = '11111111-1111-1111-1111-111111111001' AND (profile_images IS NULL OR array_length(profile_images, 1) IS NULL);

UPDATE profiles 
SET profile_images = ARRAY[
  'https://images.unsplash.com/photo-1494790108755-2616c57c8458?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face'
]
WHERE user_id = '11111111-1111-1111-1111-111111111002' AND (profile_images IS NULL OR array_length(profile_images, 1) IS NULL);

UPDATE profiles 
SET profile_images = ARRAY[
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&crop=face'
]
WHERE user_id = '11111111-1111-1111-1111-111111111003' AND (profile_images IS NULL OR array_length(profile_images, 1) IS NULL);

UPDATE profiles 
SET profile_images = ARRAY[
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face'
]
WHERE user_id = '11111111-1111-1111-1111-111111111004' AND (profile_images IS NULL OR array_length(profile_images, 1) IS NULL);

UPDATE profiles 
SET profile_images = ARRAY[
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
]
WHERE user_id = '11111111-1111-1111-1111-111111111005' AND (profile_images IS NULL OR array_length(profile_images, 1) IS NULL);