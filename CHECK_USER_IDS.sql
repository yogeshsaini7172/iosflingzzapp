-- Check what user_ids exist in profiles table
SELECT user_id, LENGTH(user_id) as uid_length, email, name 
FROM profiles 
LIMIT 10;

-- Check what user_ids exist in subscriptions table
SELECT user_id, LENGTH(user_id) as uid_length, plan, is_active 
FROM subscriptions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there's a mismatch between the two tables
SELECT 
  s.user_id as subscription_user_id,
  p.user_id as profile_user_id,
  s.plan,
  p.email
FROM subscriptions s
LEFT JOIN profiles p ON s.user_id = p.user_id
WHERE s.is_active = true OR s.payment_completed_at IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 5;

-- Find profiles that might have a different user_id format
SELECT user_id, email, created_at
FROM profiles
WHERE email LIKE '%' -- Get all profiles to see the pattern
LIMIT 20;
