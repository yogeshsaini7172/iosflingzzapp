-- Check which field in profiles has the Firebase UID
SELECT 
  id,
  user_id,
  firebase_uid,
  first_name
FROM public.profiles
WHERE user_id IS NOT NULL
LIMIT 3;
