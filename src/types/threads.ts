// Thread/Group types for real-time messaging
export interface Thread {
  id: string;
  name: string;
  description?: string;
  type: 'group' | 'study_group' | 'event' | 'general';
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  is_private: boolean;
  university?: string;
  course?: string;
  tags?: string[];
  avatar_url?: string;
}

export interface ThreadMember {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  is_active: boolean;
  user?: {
    first_name: string;
    last_name: string;
    profile_images?: string[];
    university?: string;
  };
}

export interface ThreadMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
  edited_at?: string;
  reply_to?: string;
  reactions?: ThreadReaction[];
  sender?: {
    first_name: string;
    last_name: string;
    profile_images?: string[];
  };
}

export interface ThreadReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface CreateThreadRequest {
  name: string;
  description?: string;
  type: Thread['type'];
  is_private: boolean;
  university?: string;
  course?: string;
  tags?: string[];
}