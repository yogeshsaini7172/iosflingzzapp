-- Create enhanced profiles table with detailed questionnaire data
ALTER TABLE public.profiles 
ADD COLUMN verification_status TEXT DEFAULT 'pending',
ADD COLUMN govt_id_url TEXT,
ADD COLUMN college_id_url TEXT,
ADD COLUMN verified_at TIMESTAMPTZ,
ADD COLUMN height INTEGER, -- in cm
ADD COLUMN relationship_goals TEXT[], -- casual, serious, friendship
ADD COLUMN lifestyle JSONB, -- smoking, drinking, fitness, food preferences
ADD COLUMN personality_type TEXT, -- introvert, extrovert, ambivert
ADD COLUMN humor_type TEXT,
ADD COLUMN love_language TEXT,
ADD COLUMN subscription_tier TEXT DEFAULT 'free', -- free, starter, plus, pro
ADD COLUMN subscription_expires_at TIMESTAMPTZ,
ADD COLUMN compatibility_preferences JSONB; -- age_range, height_preference, etc.

-- Create compatibility scores table for matchmaking
CREATE TABLE public.compatibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  compatibility_score INTEGER NOT NULL, -- 0-100
  physical_score INTEGER,
  mental_score INTEGER,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE public.compatibility_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for compatibility scores
CREATE POLICY "Users can view their compatibility scores" ON public.compatibility_scores
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can insert compatibility scores" ON public.compatibility_scores
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update compatibility scores" ON public.compatibility_scores
FOR UPDATE USING (true);

-- Create subscription history table
CREATE TABLE public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier TEXT NOT NULL,
  amount INTEGER NOT NULL, -- in paise
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  payment_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription history
CREATE POLICY "Users can view their subscription history" ON public.subscription_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON public.subscription_history
FOR ALL USING (true);

-- Create admin reports table
CREATE TABLE public.admin_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID,
  reported_user_id UUID NOT NULL,
  report_type TEXT NOT NULL, -- fake_id, inappropriate_behavior, spam
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for admin reports
CREATE POLICY "Users can create reports" ON public.admin_reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.admin_reports
FOR SELECT USING (auth.uid() = reporter_id);

-- Add function to calculate compatibility score
CREATE OR REPLACE FUNCTION public.calculate_compatibility(
  user1_profile JSONB,
  user2_profile JSONB
) RETURNS INTEGER AS $$
DECLARE
  physical_score INTEGER := 0;
  mental_score INTEGER := 0;
  total_score INTEGER := 0;
BEGIN
  -- Physical compatibility (age, height preferences)
  physical_score := 70; -- Base score, can be enhanced with actual logic
  
  -- Mental compatibility (interests, goals, personality)
  mental_score := 80; -- Base score, can be enhanced with actual logic
  
  -- Final score: 60% physical + 40% mental
  total_score := (physical_score * 60 + mental_score * 40) / 100;
  
  RETURN LEAST(100, GREATEST(0, total_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;