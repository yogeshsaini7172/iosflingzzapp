-- Create test users table for login credentials
CREATE TABLE public.test_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enhanced matches table for better matching system
CREATE TABLE public.enhanced_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  user1_swiped BOOLEAN DEFAULT FALSE,
  user2_swiped BOOLEAN DEFAULT FALSE,
  chat_room_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.enhanced_matches(id),
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enhanced chat messages table
CREATE TABLE public.chat_messages_enhanced (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id),
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create user interactions table for ghost/bench functionality
CREATE TABLE public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('ghost', 'bench')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, target_user_id, interaction_type)
);

-- Create enhanced swipes table
CREATE TABLE public.enhanced_swipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.test_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_swipes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Test users are viewable by everyone" ON public.test_users FOR SELECT USING (true);

CREATE POLICY "Users can view their matches" ON public.enhanced_matches 
FOR SELECT USING (user1_id::text = ANY(ARRAY[current_setting('app.current_user_id', true)]) OR user2_id::text = ANY(ARRAY[current_setting('app.current_user_id', true)]));

CREATE POLICY "Users can create matches" ON public.enhanced_matches 
FOR INSERT WITH CHECK (user1_id::text = current_setting('app.current_user_id', true) OR user2_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their matches" ON public.enhanced_matches 
FOR UPDATE USING (user1_id::text = current_setting('app.current_user_id', true) OR user2_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can view their chat rooms" ON public.chat_rooms 
FOR SELECT USING (user1_id::text = current_setting('app.current_user_id', true) OR user2_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms 
FOR INSERT WITH CHECK (user1_id::text = current_setting('app.current_user_id', true) OR user2_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can view messages in their chats" ON public.chat_messages_enhanced 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.chat_rooms WHERE id = chat_room_id AND (user1_id::text = current_setting('app.current_user_id', true) OR user2_id::text = current_setting('app.current_user_id', true))));

CREATE POLICY "Users can send messages" ON public.chat_messages_enhanced 
FOR INSERT WITH CHECK (sender_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can manage their interactions" ON public.user_interactions 
FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can create swipes" ON public.enhanced_swipes 
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can view their swipes" ON public.enhanced_swipes 
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', true));

-- Insert 10 test users with credentials
INSERT INTO public.test_users (username, password) VALUES
('user001', 'pass123'),
('user002', 'pass123'),
('user003', 'pass123'),
('user004', 'pass123'),
('user005', 'pass123'),
('user006', 'pass123'),
('user007', 'pass123'),
('user008', 'pass123'),
('user009', 'pass123'),
('user010', 'pass123');

-- Create trigger to update chat room timestamp
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms 
  SET updated_at = now() 
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_room_on_message
AFTER INSERT ON public.chat_messages_enhanced
FOR EACH ROW EXECUTE FUNCTION update_chat_room_timestamp();