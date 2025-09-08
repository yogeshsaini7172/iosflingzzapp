-- Ensure firebase_uid column exists and is properly indexed
DO $$ 
BEGIN
    -- Add firebase_uid column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'firebase_uid') THEN
        ALTER TABLE public.profiles ADD COLUMN firebase_uid TEXT;
    END IF;
    
    -- Create unique index on firebase_uid if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_firebase_uid_key') THEN
        CREATE UNIQUE INDEX profiles_firebase_uid_key ON public.profiles(firebase_uid);
    END IF;
END $$;

-- Update existing profiles to use user_id as firebase_uid if firebase_uid is null
UPDATE public.profiles 
SET firebase_uid = user_id 
WHERE firebase_uid IS NULL AND user_id IS NOT NULL;