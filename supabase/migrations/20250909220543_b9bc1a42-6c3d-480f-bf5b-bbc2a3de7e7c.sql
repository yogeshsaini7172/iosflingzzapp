-- Fix security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS candidate_profiles;

CREATE VIEW candidate_profiles 
WITH (security_invoker = true) AS
SELECT 
    id AS profile_id,
    user_id,
    first_name AS display_name,
    EXTRACT(year FROM age((date_of_birth)::timestamp with time zone)) AS age,
    gender,
    university AS location,
    bio,
    interests,
    profile_images AS photos,
    created_at
FROM profiles p
WHERE (is_active = true AND first_name IS NOT NULL AND date_of_birth IS NOT NULL);