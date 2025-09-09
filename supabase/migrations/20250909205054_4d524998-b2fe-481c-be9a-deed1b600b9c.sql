-- Add missing unique constraint that the RPC function expects
ALTER TABLE public.chat_rooms 
ADD CONSTRAINT chat_rooms_match_id_key UNIQUE (match_id);