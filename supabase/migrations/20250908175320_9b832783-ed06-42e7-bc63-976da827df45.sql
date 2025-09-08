-- Fix policy check column name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage function invocations'
  ) THEN
    CREATE POLICY "Service role can manage function invocations"
    ON public.function_invocations
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END;$$;

-- Ensure deterministic ordering and uniqueness for enhanced_matches
CREATE OR REPLACE FUNCTION public.enhanced_matches_enforce_order()
RETURNS trigger AS $$
DECLARE
  tmp text;
BEGIN
  -- Ensure user1_id <= user2_id lexicographically
  IF NEW.user1_id IS NOT NULL AND NEW.user2_id IS NOT NULL AND NEW.user1_id > NEW.user2_id THEN
    tmp := NEW.user1_id;
    NEW.user1_id := NEW.user2_id;
    NEW.user2_id := tmp;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to enforce ordering before insert/update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enhanced_matches_enforce_order'
  ) THEN
    CREATE TRIGGER trg_enhanced_matches_enforce_order
    BEFORE INSERT OR UPDATE ON public.enhanced_matches
    FOR EACH ROW
    EXECUTE FUNCTION public.enhanced_matches_enforce_order();
  END IF;
END;$$;

-- Unique index on ordered pair to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_enhanced_matches_user_pair'
  ) THEN
    CREATE UNIQUE INDEX uq_enhanced_matches_user_pair
    ON public.enhanced_matches (user1_id, user2_id);
  END IF;
END;$$;

-- Add FK from chat_rooms.match_id to enhanced_matches.id (nullable, safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_chat_rooms_match_enhanced' AND table_name = 'chat_rooms'
  ) THEN
    ALTER TABLE public.chat_rooms
    ADD CONSTRAINT fk_chat_rooms_match_enhanced
    FOREIGN KEY (match_id)
    REFERENCES public.enhanced_matches(id)
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
END;$$;

-- Lightweight function invocations log table for observability
CREATE TABLE IF NOT EXISTS public.function_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  payload jsonb,
  user_id text,
  status text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.function_invocations ENABLE ROW LEVEL SECURITY;