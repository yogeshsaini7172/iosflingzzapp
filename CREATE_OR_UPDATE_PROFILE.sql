-- Drop old function
DROP FUNCTION IF EXISTS public.update_user_subscription(text, text, text, timestamptz);

-- Create new function that CREATES profile if it doesn't exist, or UPDATES if it does
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
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_user_id) INTO profile_exists;
  
  IF profile_exists THEN
    -- Profile exists, update it
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
    
    RETURN QUERY SELECT true, 'Profile updated successfully'::text;
  ELSE
    -- Profile doesn't exist, create it with subscription info
    INSERT INTO public.profiles (
      user_id,
      subscription_plan,
      subscription_tier,
      plan_id,
      is_subscribed,
      subscription_started_at,
      subscription_expires_at,
      plan_started_at,
      plan_expires_at,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_plan,
      p_tier,
      p_plan,
      true,
      NOW(),
      p_end_date,
      NOW(),
      p_end_date,
      NOW(),
      NOW()
    );
    
    RETURN QUERY SELECT true, 'Profile created with subscription'::text;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM::text;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_user_subscription(text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_subscription(text, text, text, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_subscription(text, text, text, timestamptz) TO authenticated;

-- Test with existing user
SELECT * FROM update_user_subscription(
  'ICcBIGUR7mSw0DvXUxp1DpjyAvK2',
  'premium_243',
  'premium',
  NOW() + INTERVAL '30 days'
);

-- Verify
SELECT user_id, subscription_plan, subscription_tier, is_subscribed
FROM profiles
WHERE user_id = 'ICcBIGUR7mSw0DvXUxp1DpjyAvK2';
