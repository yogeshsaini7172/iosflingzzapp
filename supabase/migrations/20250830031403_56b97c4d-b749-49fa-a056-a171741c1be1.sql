-- Create enum types for the dating app (skip if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
        CREATE TYPE public.gender AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
        CREATE TYPE public.match_status AS ENUM ('liked', 'passed', 'matched');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blind_date_status') THEN
        CREATE TYPE public.blind_date_status AS ENUM ('pending', 'accepted', 'declined', 'completed');
    END IF;
END $$;

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