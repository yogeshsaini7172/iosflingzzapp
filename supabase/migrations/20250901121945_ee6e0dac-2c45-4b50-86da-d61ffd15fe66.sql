-- Simple migration to add what we need for CampusConnect
-- Working with existing table structures

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_tier TEXT DEFAULT 'tier3';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_qcs INTEGER DEFAULT 0;

-- Create partner preferences table
CREATE TABLE IF NOT EXISTS public.partner_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    preferred_gender TEXT[] DEFAULT '{}',
    age_range_min INTEGER DEFAULT 18,
    age_range_max INTEGER DEFAULT 30,
    preferred_relationship_goal TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create colleges table  
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL DEFAULT 'tier3',
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage preferences" ON public.partner_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "View verified colleges" ON public.colleges FOR SELECT USING (is_verified = true);
CREATE POLICY "View own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Insert sample colleges
INSERT INTO public.colleges (name, tier, city, state, is_verified) VALUES 
('Indian Institute of Technology Delhi', 'tier1', 'New Delhi', 'Delhi', true),
('Delhi University', 'tier1', 'New Delhi', 'Delhi', true),
('Manipal Academy', 'tier2', 'Manipal', 'Karnataka', true)
ON CONFLICT (name) DO NOTHING;