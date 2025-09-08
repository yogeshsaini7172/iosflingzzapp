-- Migration: Clean Firebase-only authentication setup
-- Ensure user_id columns can handle Firebase UIDs and remove any Supabase auth dependencies

-- Update profiles table to handle Firebase UIDs properly
COMMENT ON COLUMN public.profiles.user_id IS 'Firebase Authentication UID (text format)';

-- Update chat_messages_enhanced table comment  
COMMENT ON COLUMN public.chat_messages_enhanced.sender_id IS 'Firebase Authentication UID (text format)';

-- Update chat_rooms table comments
COMMENT ON COLUMN public.chat_rooms.user1_id IS 'Firebase Authentication UID (text format)';
COMMENT ON COLUMN public.chat_rooms.user2_id IS 'Firebase Authentication UID (text format)';

-- Update enhanced_matches table comments
COMMENT ON COLUMN public.enhanced_matches.user1_id IS 'Firebase Authentication UID (text format)';
COMMENT ON COLUMN public.enhanced_matches.user2_id IS 'Firebase Authentication UID (text format)';

-- Update swipes table comment
COMMENT ON COLUMN public.swipes.user_id IS 'Firebase Authentication UID (text format)';

-- Update qcs table comment  
COMMENT ON COLUMN public.qcs.user_id IS 'Firebase Authentication UID (text format)';

-- Note: All user_id columns are already TEXT type, which properly handles Firebase UIDs
-- Firebase UIDs are alphanumeric strings like "Xy2J8kL9mN3pQ4rS5tU6vW7xY8zA1B"