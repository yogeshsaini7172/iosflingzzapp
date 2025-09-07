-- Enable proper RLS policies for profiles table
-- Users should be able to create, update, and delete their own profiles

-- Drop existing policies if any
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create comprehensive RLS policies for profiles
-- Users can view all profiles (for matching)
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own profile  
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Create RLS policies for partner_preferences table
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own partner preferences
CREATE POLICY "Users can view their own preferences" 
ON public.partner_preferences 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.partner_preferences 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.partner_preferences 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own preferences" 
ON public.partner_preferences 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Create RLS policies for qcs table
ALTER TABLE public.qcs ENABLE ROW LEVEL SECURITY;

-- Users can view their own QCS scores
CREATE POLICY "Users can view their own QCS" 
ON public.qcs 
FOR SELECT 
USING (auth.uid()::text = user_id);

-- Users can create their own QCS scores
CREATE POLICY "Users can create their own QCS" 
ON public.qcs 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own QCS scores
CREATE POLICY "Users can update their own QCS" 
ON public.qcs 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Enable RLS for swipes table
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own swipes
CREATE POLICY "Users can view their own swipes" 
ON public.swipes 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own swipes" 
ON public.swipes 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Enable RLS for matches table  
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches they are part of
CREATE POLICY "Users can view their matches" 
ON public.matches 
FOR SELECT 
USING (auth.uid()::text = liker_id OR auth.uid()::text = liked_id);

-- Users can create matches for themselves
CREATE POLICY "Users can create matches for themselves" 
ON public.matches 
FOR INSERT 
WITH CHECK (auth.uid()::text = liker_id);

-- Enable RLS for chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their matches
CREATE POLICY "Users can view their chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = chat_messages.match_id 
    AND (matches.liker_id = auth.uid()::text OR matches.liked_id = auth.uid()::text)
  )
);

-- Users can create messages in their matches
CREATE POLICY "Users can create their chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid()::text = sender_id 
  AND EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = chat_messages.match_id 
    AND (matches.liker_id = auth.uid()::text OR matches.liked_id = auth.uid()::text)
  )
);