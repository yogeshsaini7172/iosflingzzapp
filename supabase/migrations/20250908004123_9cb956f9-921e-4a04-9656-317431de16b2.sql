-- Fix remaining security issues

-- 1. Fix profiles RLS - should not allow public viewing of sensitive data
DROP POLICY IF EXISTS "Users can view limited profile info for matching" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Authenticated users can view basic profile info for matching" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true 
  AND show_profile = true
);

-- 2. Fix threads - require authentication to view
DROP POLICY IF EXISTS "Anyone can view threads" ON public.threads;
DROP POLICY IF EXISTS "Anyone can view thread replies" ON public.thread_replies;
DROP POLICY IF EXISTS "Anyone can view thread likes" ON public.thread_likes;

CREATE POLICY "Authenticated users can view threads" 
ON public.threads 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view thread replies" 
ON public.thread_replies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view thread likes" 
ON public.thread_likes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Fix user_interactions - remove anonymous access
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.user_interactions;

CREATE POLICY "Users can view their own interactions" 
ON public.user_interactions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid()::text = user_id OR auth.uid()::text = target_user_id)
);

-- Update other policies to remove anonymous access
DROP POLICY IF EXISTS "Users can create their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.user_interactions;

CREATE POLICY "Authenticated users can create interactions" 
ON public.user_interactions 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);

CREATE POLICY "Authenticated users can update their interactions" 
ON public.user_interactions 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = user_id
);