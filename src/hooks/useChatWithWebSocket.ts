import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSocketChat } from '@/contexts/SocketChatContext';
import { toast } from 'sonner';

// Interfaces (ensure these are defined correctly)
export interface ChatUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_images: string[];
  university?: string;
}
export interface ChatRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_time: string | null;
  updated_at: string;
  other_user?: ChatUser;
}
export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

export const useChatWithWebSocket = (userId: string | null) => {
  const {
    isConnected: wsConnected,
    connectionStatus,
    onlineUsers,
    typingUsers,
    onMessage,
    offMessage,
    sendTypingIndicator
  } = useSocketChat();
  
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchChatRooms = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Use edge function to get chat rooms with real user names
      const { data, error } = await supabase.functions.invoke('chat-management', {
        body: { action: 'list', user_id: userId }
      });
      
      if (error) throw error;
      
      if (data.success) {
        // Transform data to match expected format
        const transformedRooms = data.data.map((room: any) => ({
          id: room.id,
          user_a_id: room.user1_id === userId ? room.user1_id : room.user2_id,
          user_b_id: room.user1_id === userId ? room.user2_id : room.user1_id,
          last_message: room.last_message,
          last_message_time: room.last_message_time,
          updated_at: room.updated_at,
          other_user: room.other_user // This now has real profile data
        }));
        
        setChatRooms(transformedRooms);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Failed to load chat rooms:', error);
      toast.error("Failed to load conversations.", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchChatRooms();
    }
  }, [userId, fetchChatRooms]);

  useEffect(() => {
    const handleNewMessage = (newMessage: ChatMessage) => {
      if (messages.length > 0 && messages[0].chat_room_id === newMessage.chat_room_id) {
        setMessages(prev => [...prev, newMessage]);
      }
      fetchChatRooms();
    };
    onMessage(handleNewMessage);
    return () => offMessage(handleNewMessage);
  }, [onMessage, offMessage, messages, fetchChatRooms]);
  
  const fetchMessages = async (chatRoomId: string) => {
    if (!chatRoomId) return;
    try {
      // Direct query to chat_messages_enhanced table
      const { data, error } = await supabase
        .from('chat_messages_enhanced')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Failed to load messages.", { description: error.message });
    }
  };

  const sendMessage = async (chatRoomId: string, messageText: string): Promise<boolean> => {
    if (!userId || !messageText.trim()) return false;
    setSendingMessage(true);
    try {
      // Direct insert into chat_messages_enhanced table
      const { data, error } = await supabase
        .from('chat_messages_enhanced')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: userId,
          message_text: messageText,
        })
        .select()
        .single();

      if (error) throw error;

      // Update chat room with last message
      await supabase
        .from('chat_rooms')
        .update({
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', chatRoomId);

      // Add message to local state immediately
      const newMessage = {
        id: data.id,
        chat_room_id: chatRoomId,
        sender_id: userId,
        message_text: messageText,
        created_at: data.created_at
      };
      setMessages(prev => [...prev, newMessage]);

      return true;
    } catch (error: any) {
      toast.error("Failed to send message.", { description: error.message });
      return false;
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleTyping = (chatRoomId: string, isTyping: boolean) => {
    sendTypingIndicator(chatRoomId, isTyping);
  };
  
  const getTypingUsers = (chatRoomId: string) => {
    return typingUsers.get(chatRoomId) || [];
  };

  const getOtherUserId = (room: ChatRoom) => {
    return room.user1_id === userId ? room.user2_id : room.user1_id;
  };

  const isUserOnline = (otherUserId: string) => {
    return onlineUsers.has(otherUserId);
  };

  return {
    chatRooms, messages, loading, sendingMessage, wsConnected, connectionStatus,
    onlineUsers, handleTyping, getTypingUsers, getOtherUserId, isUserOnline, fetchMessages, sendMessage,
  };
};