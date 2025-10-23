-- ============================================
-- COMPLETE SUBSCRIPTION SETUP FOR GRAD-SYNC
-- ============================================
-- This handles both flows:
-- 1. Payment BEFORE profile creation (trigger applies subscription)
-- 2. Payment AFTER profile creation (function updates profile)
-- ============================================

-- STEP 1: Drop old functions
DROP FUNCTION IF EXISTS public.update_user_subscription(text, text, text, timestamptz);
DROP FUNCTION IF EXISTS public.apply_subscription_to_new_profile() CASCADE;

-- STEP 2: Create function to update existing profiles
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
    -- Profile doesn't exist yet - that's OK, trigger will handle it later
    RETURN QUERY SELECT true, 'Profile will be updated when created'::text;
    RETURN;
  END IF;
  
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
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated > 0 THEN
    RETURN QUERY SELECT true, 'Profile updated successfully'::text;
  ELSE
    RETURN QUERY SELECT false, 'Profile update failed'::text;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM::text;
END;
$$;

-- STEP 3: Create trigger function for new profiles
CREATE OR REPLACE FUNCTION public.apply_subscription_to_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_subscription RECORD;
BEGIN
  -- Check if there's an active subscription for this user
  SELECT plan, start_date, end_date, is_active
  INTO user_subscription
  FROM public.subscriptions
  WHERE user_id = NEW.user_id
  AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If subscription exists, update the profile
  IF FOUND THEN
    NEW.subscription_plan := user_subscription.plan;
    NEW.subscription_tier := split_part(user_subscription.plan, '_', 1);
    NEW.plan_id := user_subscription.plan;
    NEW.is_subscribed := true;
    NEW.subscription_started_at := user_subscription.start_date;
    NEW.subscription_expires_at := user_subscription.end_date;
    NEW.plan_started_at := user_subscription.start_date;
    NEW.plan_expires_at := user_subscription.end_date;
    
    RAISE NOTICE 'Subscription % applied to new profile for user %', user_subscription.plan, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- STEP 4: Create trigger on profiles table
DROP TRIGGER IF EXISTS set_subscription_on_profile_creation ON public.profiles;
CREATE TRIGGER set_subscription_on_profile_creation
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_subscription_to_new_profile();

-- STEP 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.update_user_subscription(text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_subscription(text, text, text, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_subscription(text, text, text, timestamptz) TO authenticated;

-- ============================================
-- TESTING
-- ============================================

-- Test 1: Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_user_subscription', 'apply_subscription_to_new_profile');

-- Test 2: Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'set_subscription_on_profile_creation';

-- ============================================
-- HOW IT WORKS
-- ============================================
/*
FLOW 1: Profile exists, then payment
1. User creates profile (steps 1-6)
2. User makes payment (step 7)
3. Edge Function calls update_user_subscription()
4. Profile updated immediately with subscription data

FLOW 2: Payment first, then profile
1. User makes payment
2. Subscription saved with is_active = true
3. User creates profile later
4. Trigger automatically applies subscription data from subscriptions table
5. Profile created with subscription already set

Both flows are handled automatically!
*/
