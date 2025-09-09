-- Fix plan_id for users who have Plus Plan subscription_tier but still have free plan_id
UPDATE profiles 
SET plan_id = 'plus_89' 
WHERE subscription_tier = 'Plus Plan' AND plan_id = 'free';