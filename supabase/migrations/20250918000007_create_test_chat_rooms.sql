-- Create test chat rooms for testing chat functionality

-- First, let's see what test users we have
-- INSERT some test chat rooms between existing users

-- Create a test chat room between user001 and user002
INSERT INTO public.chat_rooms (user1_id, user2_id, created_at, updated_at)
SELECT 
  u1.profile_id::text,
  u2.profile_id::text,
  now(),
  now()
FROM public.test_users u1, public.test_users u2
WHERE u1.username = 'user001' 
  AND u2.username = 'user002'
  AND u1.profile_id IS NOT NULL 
  AND u2.profile_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create a test chat room between user001 and user003
INSERT INTO public.chat_rooms (user1_id, user2_id, created_at, updated_at)
SELECT 
  u1.profile_id::text,
  u2.profile_id::text,
  now(),
  now()
FROM public.test_users u1, public.test_users u2
WHERE u1.username = 'user001' 
  AND u2.username = 'user003'
  AND u1.profile_id IS NOT NULL 
  AND u2.profile_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Add some test messages to make the chat rooms more realistic
INSERT INTO public.chat_messages_enhanced (chat_room_id, sender_id, message_text, created_at)
SELECT 
  cr.id,
  cr.user1_id,
  'Hello! This is a test message.',
  now() - interval '1 hour'
FROM public.chat_rooms cr
LIMIT 1;

INSERT INTO public.chat_messages_enhanced (chat_room_id, sender_id, message_text, created_at)
SELECT 
  cr.id,
  cr.user2_id,
  'Hi there! Nice to meet you.',
  now() - interval '30 minutes'
FROM public.chat_rooms cr
LIMIT 1;

-- Update chat rooms with last message info
UPDATE public.chat_rooms 
SET 
  last_message = 'Hi there! Nice to meet you.',
  last_message_time = now() - interval '30 minutes'
WHERE id IN (SELECT id FROM public.chat_rooms LIMIT 1);
