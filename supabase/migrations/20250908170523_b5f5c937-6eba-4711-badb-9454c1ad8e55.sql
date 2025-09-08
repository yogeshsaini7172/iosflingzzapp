-- Fix match -> chat creation upsert errors by adding required unique constraints
-- 1) Normalize enhanced_matches ordering so (user1_id, user2_id) is deterministic
UPDATE public.enhanced_matches
SET user1_id = LEAST(user1_id::text, user2_id::text)::uuid,
    user2_id = GREATEST(user1_id::text, user2_id::text)::uuid
WHERE user1_id::text > user2_id::text;

-- 2) Deduplicate enhanced_matches keeping the earliest created row per pair
DELETE FROM public.enhanced_matches em
USING public.enhanced_matches em2
WHERE em.id <> em2.id
  AND LEAST(em.user1_id::text, em.user2_id::text) = LEAST(em2.user1_id::text, em2.user2_id::text)
  AND GREATEST(em.user1_id::text, em.user2_id::text) = GREATEST(em2.user1_id::text, em2.user2_id::text)
  AND em.created_at > em2.created_at;

-- 3) Add unique constraint for upsert target used by edge function
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'enhanced_matches_user_pair_unique'
  ) THEN
    ALTER TABLE public.enhanced_matches
    ADD CONSTRAINT enhanced_matches_user_pair_unique UNIQUE (user1_id, user2_id);
  END IF;
END$$;

-- 4) Deduplicate chat_rooms by match_id, keep earliest
DELETE FROM public.chat_rooms cr
USING public.chat_rooms cr2
WHERE cr.id <> cr2.id
  AND cr.match_id = cr2.match_id
  AND cr.created_at > cr2.created_at;

-- 5) Add unique constraint for chat_rooms(match_id) used by upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_rooms_match_id_unique'
  ) THEN
    ALTER TABLE public.chat_rooms
    ADD CONSTRAINT chat_rooms_match_id_unique UNIQUE (match_id);
  END IF;
END$$;

-- 6) Helpful indexes for lookups
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_pair 
  ON public.enhanced_swipes (user_id, target_user_id, direction);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_users 
  ON public.chat_rooms (user1_id, user2_id);
