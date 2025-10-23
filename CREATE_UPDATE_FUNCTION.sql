-- Create PostgreSQL function to update user subscription
-- Run this in Supabase SQL Editor FIRST

CREATE OR REPLACE FUNCTION update_user_subscription(
  p_user_id text,
  p_plan text,
  p_tier text,
  p_end_date timestamptz
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    subscription_plan = p_plan,
    subscription_tier = p_tier,
    plan_id = p_plan,
    is_subscribed = true,
    subscription_started_at = now(),
    subscription_expires_at = p_end_date,
    plan_started_at = now(),
    plan_expires_at = p_end_date,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Profile updated successfully'::text;
  ELSE
    RETURN QUERY SELECT false, 'No profile found with that user_id'::text;
  END IF;
END;
$$;
