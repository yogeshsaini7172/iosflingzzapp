-- Create enum types
CREATE TYPE app_subscription_tier AS ENUM ('free', 'basic', 'plus', 'premium');
CREATE TYPE swipe_direction AS ENUM ('left', 'right');
CREATE TYPE match_status AS ENUM ('pending', 'matched', 'expired');

-- Create users table (extending profiles functionality)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qualities JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_profile BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_outgoing_matches INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_incoming_matches INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pairing_requests_left INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blinddate_requests_left INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS swipes_left INTEGER DEFAULT 20;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reset TIMESTAMPTZ DEFAULT NOW();

-- Create swipes table
CREATE TABLE public.swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    direction swipe_direction NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, candidate_id)
);

-- Create enhanced matches table (updating existing if needed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'compatibility_score') THEN
        ALTER TABLE public.matches ADD COLUMN compatibility_score INTEGER;
        ALTER TABLE public.matches ADD COLUMN physical_score INTEGER;
        ALTER TABLE public.matches ADD COLUMN mental_score INTEGER;
    END IF;
END $$;

-- Create subscription limits tracking
CREATE TABLE public.subscription_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_tier app_subscription_tier NOT NULL DEFAULT 'free',
    pairing_limit INTEGER NOT NULL DEFAULT 1,
    blinddate_limit INTEGER NOT NULL DEFAULT 0,
    swipe_limit INTEGER NOT NULL DEFAULT 20,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for swipes
CREATE POLICY "Users can view their own swipes" ON public.swipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own swipes" ON public.swipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for subscription_limits
CREATE POLICY "Users can view their own subscription limits" ON public.subscription_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscription limits" ON public.subscription_limits
    FOR ALL USING (true);

-- Create function to reset daily limits
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record RECORD;
    subscription_data RECORD;
BEGIN
    FOR user_record IN 
        SELECT user_id, subscription_tier, last_reset 
        FROM profiles 
        WHERE last_reset < NOW() - INTERVAL '1 day'
    LOOP
        -- Get subscription limits
        SELECT * INTO subscription_data 
        FROM subscription_limits 
        WHERE user_id = user_record.user_id;
        
        IF NOT FOUND THEN
            -- Create default limits for free tier
            INSERT INTO subscription_limits (user_id, subscription_tier) 
            VALUES (user_record.user_id, COALESCE(user_record.subscription_tier::app_subscription_tier, 'free'));
            
            SELECT * INTO subscription_data 
            FROM subscription_limits 
            WHERE user_id = user_record.user_id;
        END IF;
        
        -- Reset daily counters based on subscription
        UPDATE profiles SET
            daily_outgoing_matches = 0,
            daily_incoming_matches = 0,
            pairing_requests_left = subscription_data.pairing_limit,
            blinddate_requests_left = subscription_data.blinddate_limit,
            swipes_left = subscription_data.swipe_limit,
            last_reset = NOW()
        WHERE user_id = user_record.user_id;
    END LOOP;
END;
$$;

-- Create function to calculate compatibility score
CREATE OR REPLACE FUNCTION public.calculate_detailed_compatibility(user1_profile JSONB, user2_profile JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    physical_score INTEGER := 70;
    mental_score INTEGER := 80;
    total_score INTEGER := 0;
    user1_reqs JSONB;
    user2_reqs JSONB;
    user1_quals JSONB;
    user2_quals JSONB;
BEGIN
    -- Extract requirements and qualities
    user1_reqs := COALESCE(user1_profile->'requirements', '{}');
    user2_reqs := COALESCE(user2_profile->'requirements', '{}');
    user1_quals := COALESCE(user1_profile->'qualities', '{}');
    user2_quals := COALESCE(user2_profile->'qualities', '{}');
    
    -- Enhanced compatibility logic would go here
    -- For now, using base scores with some variance
    physical_score := 50 + (RANDOM() * 50)::INTEGER;
    mental_score := 50 + (RANDOM() * 50)::INTEGER;
    
    -- Final score: 60% physical + 40% mental
    total_score := (physical_score * 60 + mental_score * 40) / 100;
    
    RETURN jsonb_build_object(
        'total_score', LEAST(100, GREATEST(0, total_score)),
        'physical_score', physical_score,
        'mental_score', mental_score,
        'breakdown', jsonb_build_object(
            'physical_factors', user1_reqs->'physical',
            'mental_factors', user1_reqs->'mental'
        )
    );
END;
$$;