-- CampusConnect Database Schema
-- Create comprehensive schema for verified student dating app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'plus', 'pro');
CREATE TYPE college_tier AS ENUM ('tier1', 'tier2', 'tier3');
CREATE TYPE relationship_goal AS ENUM ('casual', 'serious', 'friendship', 'networking');
CREATE TYPE love_language AS ENUM ('words_of_affirmation', 'acts_of_service', 'receiving_gifts', 'quality_time', 'physical_touch');
CREATE TYPE personality_type AS ENUM ('introvert', 'extrovert', 'ambivert');
CREATE TYPE humor_style AS ENUM ('dark', 'witty', 'light', 'sarcastic', 'silly');
CREATE TYPE skin_type AS ENUM ('fair', 'wheatish', 'dark', 'doesnt_matter');
CREATE TYPE body_shape AS ENUM ('slim', 'fit', 'average', 'curvy', 'doesnt_matter');
CREATE TYPE lifestyle_habit AS ENUM ('non_smoker', 'occasional_smoker', 'regular_smoker', 'non_drinker', 'social_drinker', 'regular_drinker');

-- 1. User Profiles Table
CREATE TABLE public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Basic Information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    college_name TEXT NOT NULL,
    phone_number TEXT,
    
    -- Verification Status
    verification_status verification_status DEFAULT 'unverified',
    college_id_url TEXT,
    govt_id_url TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Subscription
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Profile Settings
    is_profile_public BOOLEAN DEFAULT false,
    show_age BOOLEAN DEFAULT true,
    show_college BOOLEAN DEFAULT true,
    
    -- Location & College Info
    college_tier college_tier,
    city TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Quality Customer Score (QCS) - Hidden from users
    profile_quality_score INTEGER DEFAULT 0,
    college_quality_score INTEGER DEFAULT 0,
    personality_depth_score INTEGER DEFAULT 0,
    behavior_score INTEGER DEFAULT 100,
    total_qcs INTEGER DEFAULT 0,
    
    -- Profile Media
    profile_pictures TEXT[] DEFAULT '{}',
    profile_videos TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. User Personality Table
CREATE TABLE public.user_personality (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Self Description
    personality_type personality_type,
    hobbies TEXT[],
    relationship_goal relationship_goal,
    humor_style humor_style,
    love_language love_language,
    bio TEXT,
    interests TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Partner Preferences Table
CREATE TABLE public.partner_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Physical Preferences
    preferred_gender gender_type[],
    age_range_min INTEGER DEFAULT 18,
    age_range_max INTEGER DEFAULT 30,
    height_range_min INTEGER, -- in cm
    height_range_max INTEGER, -- in cm
    preferred_skin_type skin_type[],
    preferred_body_shape body_shape[],
    
    -- Mental/Personality Preferences
    preferred_humor_style humor_style[],
    preferred_personality_type personality_type[],
    preferred_relationship_goal relationship_goal[],
    preferred_lifestyle_habits lifestyle_habit[],
    
    -- Location Preferences
    max_distance INTEGER DEFAULT 50, -- in km
    same_college_only BOOLEAN DEFAULT false,
    preferred_college_tiers college_tier[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Colleges Database
CREATE TABLE public.colleges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tier college_tier NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Matches Table
CREATE TABLE public.matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Match Details
    compatibility_score DECIMAL(5,2),
    is_mutual BOOLEAN DEFAULT false,
    is_blind_date BOOLEAN DEFAULT false,
    
    -- Match Status
    user1_status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    user2_status TEXT DEFAULT 'pending',
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Chat Unlocked
    chat_unlocked BOOLEAN DEFAULT false,
    chat_unlocked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Ensure unique pairs
    CONSTRAINT unique_match_pair UNIQUE (user1_id, user2_id),
    CONSTRAINT no_self_match CHECK (user1_id != user2_id)
);

-- 6. Chat Messages Table
CREATE TABLE public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Message Content
    message_text TEXT,
    message_type TEXT DEFAULT 'text', -- text, image, sticker, gif
    media_url TEXT,
    
    -- Message Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. Reports Table
CREATE TABLE public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, reviewing, resolved, dismissed
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 8. Subscription Payments Table
CREATE TABLE public.subscription_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    subscription_tier subscription_tier NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    
    -- Payment Details
    payment_gateway TEXT, -- razorpay, stripe
    payment_id TEXT,
    payment_status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
    
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view verified profiles" ON public.profiles
FOR SELECT USING (
    verification_status = 'verified' AND 
    (is_profile_public = true OR auth.uid() = user_id)
);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_personality
CREATE POLICY "Users can manage their own personality data" ON public.user_personality
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for partner_preferences
CREATE POLICY "Users can manage their own preferences" ON public.partner_preferences
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for colleges
CREATE POLICY "Everyone can view verified colleges" ON public.colleges
FOR SELECT USING (is_verified = true);

-- RLS Policies for matches
CREATE POLICY "Users can view their own matches" ON public.matches
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their match status" ON public.matches
FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from their matches" ON public.chat_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE id = match_id 
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
        AND chat_unlocked = true
    )
);

CREATE POLICY "Users can send messages to their matches" ON public.chat_messages
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE id = match_id 
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
        AND chat_unlocked = true
    )
);

-- RLS Policies for reports
CREATE POLICY "Users can create reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
FOR SELECT USING (auth.uid() = reporter_id);

-- RLS Policies for subscription_payments
CREATE POLICY "Users can view their own payments" ON public.subscription_payments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON public.subscription_payments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX idx_profiles_college_tier ON public.profiles(college_tier);
CREATE INDEX idx_profiles_location ON public.profiles(latitude, longitude);
CREATE INDEX idx_profiles_qcs ON public.profiles(total_qcs DESC);

CREATE INDEX idx_matches_users ON public.matches(user1_id, user2_id);
CREATE INDEX idx_matches_mutual ON public.matches(is_mutual, matched_at);
CREATE INDEX idx_matches_blind_date ON public.matches(is_blind_date);

CREATE INDEX idx_chat_messages_match ON public.chat_messages(match_id, created_at);
CREATE INDEX idx_chat_messages_unread ON public.chat_messages(is_read, created_at);

-- Insert sample college data
INSERT INTO public.colleges (name, tier, city, state, latitude, longitude, is_verified) VALUES
('Indian Institute of Technology Delhi', 'tier1', 'New Delhi', 'Delhi', 28.6139, 77.2090, true),
('Indian Institute of Technology Bombay', 'tier1', 'Mumbai', 'Maharashtra', 19.1336, 72.9125, true),
('Indian Institute of Management Ahmedabad', 'tier1', 'Ahmedabad', 'Gujarat', 23.0225, 72.5714, true),
('Delhi University', 'tier1', 'New Delhi', 'Delhi', 28.6869, 77.2090, true),
('Jawaharlal Nehru University', 'tier1', 'New Delhi', 'Delhi', 28.5370, 77.1673, true),
('Birla Institute of Technology and Science', 'tier1', 'Pilani', 'Rajasthan', 28.3670, 75.5850, true),
('Indian Institute of Science', 'tier1', 'Bangalore', 'Karnataka', 13.0199, 77.5670, true),
('Manipal Academy of Higher Education', 'tier2', 'Manipal', 'Karnataka', 13.3506, 74.7919, true),
('Vellore Institute of Technology', 'tier2', 'Vellore', 'Tamil Nadu', 12.9165, 79.1325, true),
('SRM Institute of Science and Technology', 'tier2', 'Chennai', 'Tamil Nadu', 12.8230, 80.0444, true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_personality_updated_at BEFORE UPDATE ON public.user_personality
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_preferences_updated_at BEFORE UPDATE ON public.partner_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();