-- Fix SECURITY DEFINER functions that don't need elevated privileges
-- These functions only do calculations and don't need SECURITY DEFINER

-- Fix calculate_compatibility function
CREATE OR REPLACE FUNCTION public.calculate_compatibility(user1_profile jsonb, user2_profile jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix calculate_profile_completion function
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_data jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    completion_score INTEGER := 0;
BEGIN
    -- Basic info (20%)
    IF profile_data->>'first_name' IS NOT NULL AND profile_data->>'first_name' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    IF profile_data->>'last_name' IS NOT NULL AND profile_data->>'last_name' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    IF profile_data->>'bio' IS NOT NULL AND length(profile_data->>'bio') > 20 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Photos (30%)
    IF profile_data->'profile_images' IS NOT NULL AND jsonb_array_length(profile_data->'profile_images') >= 1 THEN
        completion_score := completion_score + 10;
    END IF;
    IF profile_data->'profile_images' IS NOT NULL AND jsonb_array_length(profile_data->'profile_images') >= 3 THEN
        completion_score := completion_score + 20;
    END IF;
    
    -- Interests (20%)
    IF profile_data->'interests' IS NOT NULL AND jsonb_array_length(profile_data->'interests') >= 3 THEN
        completion_score := completion_score + 20;
    END IF;
    
    -- Education & Goals (20%)
    IF profile_data->>'university' IS NOT NULL AND profile_data->>'university' != '' THEN
        completion_score := completion_score + 10;
    END IF;
    IF profile_data->'relationship_goals' IS NOT NULL AND jsonb_array_length(profile_data->'relationship_goals') >= 1 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Lifestyle & Personality (10%)
    IF profile_data->'lifestyle' IS NOT NULL THEN
        completion_score := completion_score + 5;
    END IF;
    IF profile_data->>'personality_type' IS NOT NULL AND profile_data->>'personality_type' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    RETURN LEAST(100, completion_score);
END;
$function$;