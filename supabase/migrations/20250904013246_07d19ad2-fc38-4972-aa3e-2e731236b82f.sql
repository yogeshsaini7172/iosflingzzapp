-- Add more test users with realistic credentials
INSERT INTO public.test_users (username, password) VALUES
('alice_stanford', 'pass123'),
('bob_harvard', 'pass123'),
('charlie_mit', 'pass123'),
('diana_yale', 'pass123'),
('elena_princeton', 'pass123'),
('frank_columbia', 'pass123'),
('grace_berkeley', 'pass123'),
('henry_cornell', 'pass123'),
('ivy_brown', 'pass123'),
('jack_duke', 'pass123'),
('kate_northwestern', 'pass123'),
('liam_chicago', 'pass123'),
('mia_penn', 'pass123'),
('noah_dartmouth', 'pass123'),
('olivia_vanderbilt', 'pass123'),
('peter_rice', 'pass123'),
('quinn_emory', 'pass123'),
('ruby_georgetown', 'pass123'),
('sam_nyu', 'pass123'),
('tara_usc', 'pass123');

-- Update ghost interaction expiry logic (45 days for re-pairing)
UPDATE public.user_interactions 
SET expires_at = created_at + INTERVAL '45 days' 
WHERE interaction_type = 'ghost' AND expires_at IS NOT NULL;

-- Create index for better performance on swipe queries
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_user_target ON public.enhanced_swipes(user_id, target_user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_direction ON public.enhanced_swipes(direction);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type_expiry ON public.user_interactions(interaction_type, expires_at);

-- Add a function to automatically clean up expired ghost interactions
CREATE OR REPLACE FUNCTION cleanup_expired_ghosts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_interactions 
  WHERE interaction_type = 'ghost' 
  AND expires_at IS NOT NULL 
  AND expires_at < NOW();
END;
$$;