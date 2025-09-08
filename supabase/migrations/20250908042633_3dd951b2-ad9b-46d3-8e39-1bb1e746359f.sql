-- Clean all user data from the database for fresh testing
-- Delete in order to respect foreign key constraints

-- Delete chat messages first
DELETE FROM public.chat_messages_enhanced;
DELETE FROM public.chat_messages;
DELETE FROM public.messages;

-- Delete thread related data
DELETE FROM public.thread_replies;
DELETE FROM public.thread_likes;
DELETE FROM public.threads;

-- Delete matching and interaction data
DELETE FROM public.matches;
DELETE FROM public.enhanced_matches;
DELETE FROM public.swipes;
DELETE FROM public.enhanced_swipes;
DELETE FROM public.user_interactions;

-- Delete chat and communication data
DELETE FROM public.chat_rooms;
DELETE FROM public.chat_requests;
DELETE FROM public.blind_dates;

-- Delete blocking data
DELETE FROM public.blocks;

-- Delete reports
DELETE FROM public.admin_reports;

-- Delete subscription and QCS data
DELETE FROM public.subscription_history;
DELETE FROM public.subscription_limits;
DELETE FROM public.subscribers;
DELETE FROM public.qcs;
DELETE FROM public.compatibility_scores;

-- Delete verification data
DELETE FROM public.identity_verifications;

-- Delete preferences and profiles last
DELETE FROM public.partner_preferences;
DELETE FROM public.profiles;

-- Delete candidate profiles (if any test data)
DELETE FROM public.candidate_profiles;