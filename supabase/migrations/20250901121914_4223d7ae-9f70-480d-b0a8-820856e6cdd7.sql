-- Add missing columns and tables for CampusConnect
-- Working with existing profiles table

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_age BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_college BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_tier TEXT DEFAULT 'tier3';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_quality_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_quality_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_depth_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS behavior_score INTEGER DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_qcs INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create partner preferences table
CREATE TABLE IF NOT EXISTS public.partner_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Physical Preferences
    preferred_gender TEXT[] DEFAULT '{}',
    age_range_min INTEGER DEFAULT 18,
    age_range_max INTEGER DEFAULT 30,
    height_range_min INTEGER,
    height_range_max INTEGER,
    preferred_skin_type TEXT[] DEFAULT '{}',
    preferred_body_shape TEXT[] DEFAULT '{}',
    
    -- Mental/Personality Preferences
    preferred_humor_style TEXT[] DEFAULT '{}',
    preferred_personality_type TEXT[] DEFAULT '{}',
    preferred_relationship_goal TEXT[] DEFAULT '{}',
    preferred_lifestyle_habits TEXT[] DEFAULT '{}',
    
    -- Location Preferences
    max_distance INTEGER DEFAULT 50,
    same_college_only BOOLEAN DEFAULT false,
    preferred_college_tiers TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create colleges table if not exists
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL DEFAULT 'tier3',
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chat_messages table if not exists
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    message_text TEXT,
    message_type TEXT DEFAULT 'text',
    media_url TEXT,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for partner_preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.partner_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.partner_preferences
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for colleges
DROP POLICY IF EXISTS "Everyone can view verified colleges" ON public.colleges;
CREATE POLICY "Everyone can view verified colleges" ON public.colleges
FOR SELECT USING (is_verified = true);

-- Create RLS policies for chat_messages
DROP POLICY IF EXISTS "Users can view messages from their matches" ON public.chat_messages;
CREATE POLICY "Users can view messages from their matches" ON public.chat_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE id = match_id 
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can send messages to their matches" ON public.chat_messages;
CREATE POLICY "Users can send messages to their matches" ON public.chat_messages
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE id = match_id 
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
);

-- Insert sample colleges if they don't exist
INSERT INTO public.colleges (name, tier, city, state, latitude, longitude, is_verified) 
VALUES 
('Indian Institute of Technology Delhi', 'tier1', 'New Delhi', 'Delhi', 28.6139, 77.2090, true),
('Indian Institute of Technology Bombay', 'tier1', 'Mumbai', 'Maharashtra', 19.1336, 72.9125, true),
('Delhi University', 'tier1', 'New Delhi', 'Delhi', 28.6869, 77.2090, true),
('Manipal Academy of Higher Education', 'tier2', 'Manipal', 'Karnataka', 13.3506, 74.7919, true),
('Vellore Institute of Technology', 'tier2', 'Vellore', 'Tamil Nadu', 12.9165, 79.1325, true)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_verification ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_college_tier ON public.profiles(college_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_qcs ON public.profiles(total_qcs DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match ON public.chat_messages(match_id, created_at);

-- Update existing RLS policies for profiles to include new logic
DROP POLICY IF EXISTS "Users can view verified profiles" ON public.profiles;
CREATE POLICY "Users can view verified profiles" ON public.profiles
FOR SELECT USING (
    (verification_status = 'verified' OR verification_status = 'approved') AND 
    (is_profile_public = true OR auth.uid() = user_id)
);

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on new tables
DROP TRIGGER IF EXISTS update_partner_preferences_updated_at ON public.partner_preferences;
CREATE TRIGGER update_partner_preferences_updated_at 
BEFORE UPDATE ON public.partner_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();