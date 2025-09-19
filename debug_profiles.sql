-- Debug queries to check profiles table structure and data

-- 1. Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- 2. Check sample profiles data
SELECT * FROM public.profiles LIMIT 5;

-- 3. Check chat_rooms data to see user ID format
SELECT user1_id, user2_id FROM public.chat_rooms LIMIT 5;

-- 4. Check if user IDs from chat_rooms exist in profiles
SELECT DISTINCT cr.user1_id, cr.user2_id, p1.first_name as user1_name, p2.first_name as user2_name
FROM public.chat_rooms cr
LEFT JOIN public.profiles p1 ON p1.user_id = cr.user1_id
LEFT JOIN public.profiles p2 ON p2.user_id = cr.user2_id
LIMIT 5;
