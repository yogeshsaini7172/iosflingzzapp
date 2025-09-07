-- Add required subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_swipes_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_swipes_reset_at DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS extra_pairings_left INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS boosts_remaining INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS superlikes_remaining INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_insights_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_see_who_liked_you BOOLEAN DEFAULT FALSE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profile_timestamp();