import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import { useToast } from '@/hooks/use-toast';

export interface ChatRoom {
  id: string;
  match_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    first_name: string;
    last_name: string;
    profile_images?: string[];
    university?: string;
  };
  last_message?: string;
  last_message_time?: string;
}

export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

export const useChat = (userId: string | null) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();

  // Fetch chat rooms
  const fetchChatRooms = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching chat rooms for user:', userId);
      
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/chat-management', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'list',
          user_id: userId 
        })
      });

      if (!response.ok) throw new Error('Failed to fetch chat rooms');
      const data = await response.json();
      
      if (data?.success) {
        const rooms = data.data || [];
        console.log('✅ Loaded chat rooms:', rooms.length);
        setChatRooms(rooms);
      } else {
        throw new Error(data?.error || 'Failed to fetch chat rooms');
      }
    } catch (error: any) {
      console.error('❌ Error fetching chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load chats. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Fetch messages for a specific chat room
  const fetchMessages = useCallback(async (chatRoomId: string) => {
    if (!userId) return;
    try {
      console.log('💬 Fetching messages for room:', chatRoomId);

      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/chat-management', {
        method: 'POST',
        body: JSON.stringify({
          action: 'get_messages',
          chat_room_id: chatRoomId,
          user_id: userId
        })
      });

      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();

      if (data?.success) {
        console.log('✅ Loaded messages:', data.data?.length || 0);
        setMessages(data.data || []);
      } else {
        throw new Error(data?.error || 'Failed to fetch messages');
      }
    } catch (error: any) {
      console.error('❌ Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  // Send a message
  const sendMessage = useCallback(async (chatRoomId: string, messageText: string) => {
    if (!userId || !messageText.trim()) return false;

    setSendingMessage(true);
    try {
      console.log('📤 Sending message to room:', chatRoomId);

      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/chat-management', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_message',
          chat_room_id: chatRoomId,
          user_id: userId,
          message: messageText.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();

      if (data?.success) {
        console.log('✅ Message sent successfully');
        return true;
      } else {
        throw new Error(data?.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setSendingMessage(false);
    }
  }, [userId, toast]);


  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages_enhanced'
      }, (payload) => {
        console.log('📨 New message received:', payload);
        const newMessage = payload.new as ChatMessage;
        
        // Add message if it's for the current conversation
        setMessages(prev => {
          const exists = prev.find(m => m.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        
        // Refresh chat rooms to update last message
        fetchChatRooms();
      })
      .subscribe();

    // Subscribe to new chat rooms
    const roomsChannel = supabase
      .channel('chat-rooms')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_rooms'
      }, () => {
        console.log('🏠 New chat room detected, refreshing...');
        fetchChatRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(roomsChannel);
    };
  }, [userId, fetchChatRooms]);

  // Load chat rooms on mount
  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  return {
    chatRooms,
    messages,
    loading,
    sendingMessage,
    fetchChatRooms,
    fetchMessages,
    sendMessage
  };
};