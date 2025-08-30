-- Create enum types for the dating app
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE public.match_status AS ENUM ('liked', 'passed', 'matched');
CREATE TYPE public.blind_date_status AS ENUM ('pending', 'accepted', 'declined', 'completed');

-- User profiles table with comprehensive dating app fields
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender public.gender NOT NULL,
    bio TEXT,
    interests TEXT[],
    university TEXT NOT NULL,
    major TEXT,
    year_of_study INTEGER CHECK (year_of_study >= 1 AND year_of_study <= 8),
    profile_images TEXT[],
    location TEXT,
    govt_id_verified BOOLEAN DEFAULT FALSE,
    student_id_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Identity verification table
CREATE TABLE public.identity_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    govt_id_image_url TEXT,
    student_id_image_url TEXT,
    govt_id_status public.verification_status DEFAULT 'pending',
    student_id_status public.verification_status DEFAULT 'pending',
    govt_id_submitted_at TIMESTAMP WITH TIME ZONE,
    student_id_submitted_at TIMESTAMP WITH TIME ZONE,
    govt_id_verified_at TIMESTAMP WITH TIME ZONE,
    student_id_verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Matches/likes table for Tinder-style system
CREATE TABLE public.matches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    liker_id UUID NOT NULL,
    liked_id UUID NOT NULL,
    status public.match_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(liker_id, liked_id)
);

-- Blind dates table
CREATE TABLE public.blind_dates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    proposed_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    message TEXT,
    status public.blind_date_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages table for matched users
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blind_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (public read, own write)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for identity verifications
CREATE POLICY "Users can view their own verifications" 
ON public.identity_verifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications" 
ON public.identity_verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications" 
ON public.identity_verifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for matches
CREATE POLICY "Users can view their own matches" 
ON public.matches 
FOR SELECT 
USING (auth.uid() = liker_id OR auth.uid() = liked_id);

CREATE POLICY "Users can create matches" 
ON public.matches 
FOR INSERT 
WITH CHECK (auth.uid() = liker_id);

-- RLS Policies for blind dates
CREATE POLICY "Users can view their blind dates" 
ON public.blind_dates 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create blind date requests" 
ON public.blind_dates 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update blind dates they're involved in" 
ON public.blind_dates 
FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their matches" 
ON public.messages 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE id = match_id AND (liker_id = auth.uid() OR liked_id = auth.uid())
    )
);

CREATE POLICY "Users can send messages in their matches" 
ON public.messages 
FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE id = match_id AND (liker_id = auth.uid() OR liked_id = auth.uid())
    )
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_university ON public.profiles(university);
CREATE INDEX idx_profiles_gender ON public.profiles(gender);
CREATE INDEX idx_matches_liker_id ON public.matches(liker_id);
CREATE INDEX idx_matches_liked_id ON public.matches(liked_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_blind_dates_requester ON public.blind_dates(requester_id);
CREATE INDEX idx_blind_dates_recipient ON public.blind_dates(recipient_id);
CREATE INDEX idx_messages_match_id ON public.messages(match_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_identity_verifications_updated_at
    BEFORE UPDATE ON public.identity_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blind_dates_updated_at
    BEFORE UPDATE ON public.blind_dates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();