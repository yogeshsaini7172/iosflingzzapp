-- Add QCS (Quality of Customer Score) table
CREATE TABLE public.qcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    profile_score INTEGER DEFAULT 0,
    college_tier INTEGER DEFAULT 0,
    personality_depth INTEGER DEFAULT 0,
    behavior_score INTEGER DEFAULT 100,
    total_score INTEGER GENERATED ALWAYS AS 
        (profile_score + college_tier + personality_depth + behavior_score) STORED,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for QCS
ALTER TABLE public.qcs ENABLE ROW LEVEL SECURITY;

-- QCS policies
CREATE POLICY "Users can view their own QCS" 
ON public.qcs 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can manage QCS" 
ON public.qcs 
FOR ALL 
USING (true);

-- Add blocks table for user blocking
CREATE TABLE public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    blocked_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, blocked_user_id)
);

-- Enable RLS for blocks
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Blocks policies
CREATE POLICY "Users can manage their blocks" 
ON public.blocks 
FOR ALL 
USING (auth.uid()::text = user_id::text);

-- Add relationship_status to profiles for Gen-Z terms
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'single';

-- Add profile completion tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Add questions_answered tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0;

-- Add reports_count for QCS calculation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0;

-- Update the updated_at trigger for QCS
CREATE TRIGGER update_qcs_updated_at
    BEFORE UPDATE ON public.qcs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate profile completion
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_data jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    completion_score INTEGER := 0;
BEGIN
    -- Basic info (20%)
    IF profile_data->>'first_name' IS NOT NULL AND profile_data->>'first_name' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    IF profile_data->>'last_name' IS NOT NULL AND profile_data->>'last_name' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    IF profile_data->>'bio' IS NOT NULL AND length(profile_data->>'bio') > 20 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Photos (30%)
    IF profile_data->'profile_images' IS NOT NULL AND jsonb_array_length(profile_data->'profile_images') >= 1 THEN
        completion_score := completion_score + 10;
    END IF;
    IF profile_data->'profile_images' IS NOT NULL AND jsonb_array_length(profile_data->'profile_images') >= 3 THEN
        completion_score := completion_score + 20;
    END IF;
    
    -- Interests (20%)
    IF profile_data->'interests' IS NOT NULL AND jsonb_array_length(profile_data->'interests') >= 3 THEN
        completion_score := completion_score + 20;
    END IF;
    
    -- Education & Goals (20%)
    IF profile_data->>'university' IS NOT NULL AND profile_data->>'university' != '' THEN
        completion_score := completion_score + 10;
    END IF;
    IF profile_data->'relationship_goals' IS NOT NULL AND jsonb_array_length(profile_data->'relationship_goals') >= 1 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Lifestyle & Personality (10%)
    IF profile_data->'lifestyle' IS NOT NULL THEN
        completion_score := completion_score + 5;
    END IF;
    IF profile_data->>'personality_type' IS NOT NULL AND profile_data->>'personality_type' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    RETURN LEAST(100, completion_score);
END;
$$;