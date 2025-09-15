-- Add constraints and indexes to enhanced_swipes table
ALTER TABLE enhanced_swipes
ADD CONSTRAINT unique_user_swipe UNIQUE (user_id, target_user_id);

-- Add proper foreign key constraints if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'enhanced_swipes_user_id_fkey'
    ) THEN
        ALTER TABLE enhanced_swipes
        ADD CONSTRAINT enhanced_swipes_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'enhanced_swipes_target_user_id_fkey'
    ) THEN
        ALTER TABLE enhanced_swipes
        ADD CONSTRAINT enhanced_swipes_target_user_id_fkey
        FOREIGN KEY (target_user_id) REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_user_target 
ON enhanced_swipes(user_id, target_user_id);

CREATE INDEX IF NOT EXISTS idx_enhanced_swipes_target_user 
ON enhanced_swipes(target_user_id, user_id);

-- Add trigger to prevent duplicate swipes
CREATE OR REPLACE FUNCTION prevent_duplicate_swipes()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a swipe already exists
    IF EXISTS (
        SELECT 1 FROM enhanced_swipes
        WHERE user_id = NEW.user_id 
        AND target_user_id = NEW.target_user_id
    ) THEN
        RAISE EXCEPTION 'Duplicate swipe detected'
            USING HINT = 'User has already swiped on this profile';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_duplicate_swipes ON enhanced_swipes;
CREATE TRIGGER check_duplicate_swipes
    BEFORE INSERT ON enhanced_swipes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_swipes();

-- Update enhanced_matches table
ALTER TABLE enhanced_matches
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add unique constraint on user pairs
ALTER TABLE enhanced_matches
ADD CONSTRAINT unique_match_users 
UNIQUE (user1_id, user2_id);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON enhanced_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();