-- Create subscribers table for subscription management
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create partner preferences table
CREATE TABLE IF NOT EXISTS public.partner_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age_range_min INTEGER DEFAULT 18,
  age_range_max INTEGER DEFAULT 30,
  preferred_gender TEXT[] DEFAULT ARRAY['male', 'female'],
  campus_preference BOOLEAN DEFAULT true,
  height_range_min INTEGER,
  height_range_max INTEGER,
  preferred_body_types TEXT[],
  preferred_values TEXT[],
  preferred_mindset TEXT[],
  preferred_personality TEXT[],
  relationship_goal_preference TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "System can manage subscriptions" ON public.subscribers
  FOR ALL USING (true);

-- RLS policies for partner preferences
CREATE POLICY "Users can manage their own preferences" ON public.partner_preferences
  FOR ALL USING (user_id = auth.uid());

-- Update profiles table to include daily limits
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_swipes_used INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_swipe_reset TIMESTAMPTZ DEFAULT now();