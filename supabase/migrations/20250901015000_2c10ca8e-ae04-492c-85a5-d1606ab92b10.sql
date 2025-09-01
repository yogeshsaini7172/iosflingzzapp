-- Fix security issues by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_compatibility(
  user1_profile JSONB,
  user2_profile JSONB
) RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  physical_score INTEGER := 0;
  mental_score INTEGER := 0;
  total_score INTEGER := 0;
BEGIN
  -- Physical compatibility (age, height preferences)
  physical_score := 70; -- Base score, can be enhanced with actual logic
  
  -- Mental compatibility (interests, goals, personality)
  mental_score := 80; -- Base score, can be enhanced with actual logic
  
  -- Final score: 60% physical + 40% mental
  total_score := (physical_score * 60 + mental_score * 40) / 100;
  
  RETURN LEAST(100, GREATEST(0, total_score));
END;
$$;