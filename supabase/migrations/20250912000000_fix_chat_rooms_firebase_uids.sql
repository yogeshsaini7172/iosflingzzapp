-- Comprehensive fix for Firebase UID compatibility across all chat-related tables
-- This migration converts UUID fields to TEXT fields for Firebase Authentication compatibility

-- ============================================================================
-- PART 1: Fix chat_rooms table
-- ============================================================================

-- Drop existing RLS policies that might interfere
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their chat rooms" ON public.chat_rooms;

-- Change user1_id and user2_id from UUID to TEXT to match Firebase UIDs
ALTER TABLE public.chat_rooms 
ALTER COLUMN user1_id TYPE text;

ALTER TABLE public.chat_rooms 
ALTER COLUMN user2_id TYPE text;

-- Add helpful comments
COMMENT ON COLUMN public.chat_rooms.user1_id IS 'Firebase Auth UID (text format)';
COMMENT ON COLUMN public.chat_rooms.user2_id IS 'Firebase Auth UID (text format)';

-- Recreate RLS policies with correct text comparison
CREATE POLICY "Users can view their chat rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
);

CREATE POLICY "Users can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
);

CREATE POLICY "Users can update their chat rooms" 
ON public.chat_rooms 
FOR UPDATE 
USING (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
)
WITH CHECK (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
);

-- Ensure RLS is enabled
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Fix enhanced_matches table
-- ============================================================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their enhanced matches" ON public.enhanced_matches;
DROP POLICY IF EXISTS "Users can create enhanced matches" ON public.enhanced_matches;
DROP POLICY IF EXISTS "Users can update their enhanced matches" ON public.enhanced_matches;

-- Change user1_id and user2_id from UUID to TEXT
ALTER TABLE public.enhanced_matches 
ALTER COLUMN user1_id TYPE text;

ALTER TABLE public.enhanced_matches 
ALTER COLUMN user2_id TYPE text;

-- Add helpful comments
COMMENT ON COLUMN public.enhanced_matches.user1_id IS 'Firebase Auth UID (text format)';
COMMENT ON COLUMN public.enhanced_matches.user2_id IS 'Firebase Auth UID (text format)';

-- Recreate RLS policies
CREATE POLICY "Users can view their enhanced matches" 
ON public.enhanced_matches 
FOR SELECT 
USING (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
);

CREATE POLICY "Users can create enhanced matches" 
ON public.enhanced_matches 
FOR INSERT 
WITH CHECK (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
);

CREATE POLICY "Users can update their enhanced matches" 
ON public.enhanced_matches 
FOR UPDATE 
USING (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
)
WITH CHECK (
  user1_id = (auth.uid())::text OR user2_id = (auth.uid())::text
);

-- ============================================================================
-- PART 3: Fix user_interactions table
-- ============================================================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can create interactions" ON public.user_interactions;

-- Change user_id and target_user_id from UUID to TEXT
ALTER TABLE public.user_interactions 
ALTER COLUMN user_id TYPE text;

ALTER TABLE public.user_interactions 
ALTER COLUMN target_user_id TYPE text;

-- Add helpful comments
COMMENT ON COLUMN public.user_interactions.user_id IS 'Firebase Auth UID (text format)';
COMMENT ON COLUMN public.user_interactions.target_user_id IS 'Firebase Auth UID (text format)';

-- Recreate RLS policies
CREATE POLICY "Users can view their interactions" 
ON public.user_interactions 
FOR SELECT 
USING (
  user_id = (auth.uid())::text
);

CREATE POLICY "Users can create interactions" 
ON public.user_interactions 
FOR INSERT 
WITH CHECK (
  user_id = (auth.uid())::text
);

-- ============================================================================
-- PART 4: Fix enhanced_swipes table
-- ============================================================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their swipes" ON public.enhanced_swipes;
DROP POLICY IF EXISTS "Users can create swipes" ON public.enhanced_swipes;

-- Change user_id and target_user_id from UUID to TEXT
ALTER TABLE public.enhanced_swipes 
ALTER COLUMN user_id TYPE text;

ALTER TABLE public.enhanced_swipes 
ALTER COLUMN target_user_id TYPE text;

-- Add helpful comments
COMMENT ON COLUMN public.enhanced_swipes.user_id IS 'Firebase Auth UID (text format)';
COMMENT ON COLUMN public.enhanced_swipes.target_user_id IS 'Firebase Auth UID (text format)';

-- Recreate RLS policies
CREATE POLICY "Users can view their swipes" 
ON public.enhanced_swipes 
FOR SELECT 
USING (
  user_id = (auth.uid())::text
);

CREATE POLICY "Users can create swipes" 
ON public.enhanced_swipes 
FOR INSERT 
WITH CHECK (
  user_id = (auth.uid())::text
);

-- ============================================================================
-- PART 5: Add performance indexes
-- ============================================================================

-- Chat rooms indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user1_id ON public.chat_rooms(user1_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user2_id ON public.chat_rooms(user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_users ON public.chat_rooms(user1_id, user2_id);

-- Enhanced matches indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_matches_user1_id ON public.enhanced_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_matches_user2_id ON public.enhanced_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_matches_users ON public.enhanced_matches(user1_id, user2_id);

-- User interactions indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target_user_id ON public.user_interactions(target_user_id);

-- Enhanced swipes indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_user_id ON public.enhanced_swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_target_user_id ON public.enhanced_swipes(target_user_id);

-- ============================================================================
-- PART 6: Ensure all tables have RLS enabled
-- ============================================================================

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_swipes ENABLE ROW LEVEL SECURITY;