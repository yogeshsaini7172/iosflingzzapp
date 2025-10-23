-- Drop the old function if it exists
DROP FUNCTION IF EXISTS public.update_user_subscription(text, text, text, timestamptz);

-- Create a simpler function that returns void instead of table
CREATE OR REPLACE FUNCTION public.update_profile_subscription(
  uid text,
  sub_plan text,
  sub_tier text,
  expires_at timestamptz
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.profiles 
  SET 
    subscription_plan = sub_plan,
    subscription_tier = sub_tier,
    plan_id = sub_plan,
    is_subscribed = true,
    subscription_started_at = NOW(),
    subscription_expires_at = expires_at,
    plan_started_at = NOW(),
    plan_expires_at = expires_at
  WHERE user_id = uid;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.update_profile_subscription(text, text, text, timestamptz) TO service_role;

-- Test the function
SELECT public.update_profile_subscription(
  'jI9l0Ol8oNOApOVhZo1xRhdKOAE3',
  'standard_129',
  'standard',
  NOW() + INTERVAL '30 days'
);

-- Verify it worked
SELECT user_id, subscription_plan, subscription_tier, is_subscribed 
FROM profiles 
WHERE user_id = 'jI9l0Ol8oNOApOVhZo1xRhdKOAE3';
