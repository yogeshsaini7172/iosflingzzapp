-- FINAL CORRECTED VERSION - Run this SQL in Supabase SQL Editor

-- Drop old functions
DROP FUNCTION IF EXISTS public.update_user_subscription(text, text, text, timestamptz);

-- Create function that handles BOTH scenarios gracefully
CREATE OR REPLACE FUNCTION public.update_user_subscription(
  p_user_id text,
  p_plan text,
  p_tier text,
  p_end_date timestamptz
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_exists boolean;
  rows_updated integer;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_user_id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- Profile doesn't exist yet - that's OK, trigger will handle it when profile is created
    RETURN QUERY SELECT true, 'Subscription saved. Profile will be updated when created.'::text;
    RETURN;
  END IF;
  
  -- Profile exists, update it NOW
  UPDATE public.profiles 
  SET 
    subscription_plan = p_plan,
    subscription_tier = p_tier,
    plan_id = p_plan,
    is_subscribed = true,
    subscription_started_at = NOW(),
    subscription_expires_at = p_end_date,
    plan_started_at = NOW(),
    plan_expires_at = p_end_date,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated > 0 THEN
    RETURN QUERY SELECT true, 'Profile updated successfully with subscription'::text;
  ELSE
    RETURN QUERY SELECT false, 'Profile update failed'::text;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM::text;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_user_subscription(text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_subscription(text, text, text, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_subscription(text, text, text, timestamptz) TO authenticated;
