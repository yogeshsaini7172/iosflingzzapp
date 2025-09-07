-- Create candidate_profiles view for optimized feed queries
CREATE OR REPLACE VIEW public.candidate_profiles AS
SELECT
  p.id as profile_id,
  p.user_id,
  p.first_name as display_name,
  EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age,
  p.gender,
  p.university as location,
  p.bio,
  p.interests,
  p.profile_images as photos,
  p.created_at
FROM public.profiles p
WHERE
  -- Profile is active
  p.is_active = true
  -- Has basic required fields
  AND p.first_name IS NOT NULL
  AND p.date_of_birth IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_user_target ON public.enhanced_swipes(user_id, target_user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_matches_users ON public.enhanced_matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_target ON public.user_interactions(user_id, target_user_id);