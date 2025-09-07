-- Fix partner_preferences upsert for Firebase auth
-- Update RLS policies to work with external auth (Firebase)
DROP POLICY IF EXISTS "Users can create their own preferences" ON partner_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON partner_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON partner_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON partner_preferences;
DROP POLICY IF EXISTS "Anon can insert preferences (demo)" ON partner_preferences;
DROP POLICY IF EXISTS "Anon can update preferences (demo)" ON partner_preferences;
DROP POLICY IF EXISTS "Anon can select preferences (demo)" ON partner_preferences;

-- New policies for Firebase auth (no Supabase auth check)
CREATE POLICY "Allow all operations on partner_preferences"
ON partner_preferences
FOR ALL
USING (true)
WITH CHECK (true);

-- Ensure the upsert works properly by setting the right conflict target
-- Check if the unique constraint exists and matches what we expect
DO $$
BEGIN
    -- If there's no proper unique constraint on user_id, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'partner_preferences' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%user_id%'
    ) THEN
        -- Add unique constraint on user_id if it doesn't exist
        ALTER TABLE partner_preferences ADD CONSTRAINT partner_preferences_user_id_unique UNIQUE (user_id);
    END IF;
END $$;