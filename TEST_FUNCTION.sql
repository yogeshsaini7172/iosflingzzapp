-- First, verify the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_user_subscription';

-- Test the function with your user_id
SELECT * FROM update_user_subscription(
  'jI9l0Ol8oNOApOVhZo1xRhdKOAE3',  -- Replace with your actual user_id
  'standard_129',
  'standard',
  NOW() + INTERVAL '30 days'
);

-- Verify the profile was updated
SELECT user_id, subscription_plan, subscription_tier, plan_id, is_subscribed, subscription_expires_at
FROM profiles 
WHERE user_id = 'jI9l0Ol8oNOApOVhZo1xRhdKOAE3';  -- Replace with your actual user_id
