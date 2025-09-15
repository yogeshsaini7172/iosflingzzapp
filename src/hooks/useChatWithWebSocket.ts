import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSocketChat } from '@/contexts/SocketChatContext';
import { toast } from 'sonner';

// Define interfaces for type safety
export interface ChatUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_images: string[];
  university?: string;
}

export interface ChatRoom {
  id: string;
  user_a_id: string;
  user_b_id: string;
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
      const { data, error } = await supabase.functions.invoke('chat-management', {
        body: { action: 'list', user_id: userId }
      });
      if (error) throw error;
      if (data.success) {
        setChatRooms(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
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
      // Add the new message only if it belongs to the currently viewed chat room
      if (messages.length > 0 && messages[0].chat_room_id === newMessage.chat_room_id) {
        setMessages(prev => [...prev, newMessage]);
      }
      // Refresh chat rooms to show the latest message snippet
      fetchChatRooms();
    };
    onMessage(handleNewMessage);
    return () => offMessage(handleNewMessage);
  }, [onMessage, offMessage, messages, fetchChatRooms]);
  
  const fetchMessages = async (chatRoomId: string) => {
    if (!chatRoomId) return;
    try {
      // Corrected column name from "chat_id" to "chat_room_id"
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_room_id", chatRoomId)
        .order("created_at", { ascending: true });

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
      const { data, error } = await supabase.functions.invoke('chat-management', {
        body: {
          action: 'send',
          chat_room_id: chatRoomId,
          sender_id: userId,
          message_text: messageText,
        }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
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

  const isUserOnline = (otherUserId: string) => {
    return onlineUsers.has(otherUserId);
  };

  return {
    chatRooms,
    messages,
    loading,
    sendingMessage,
    wsConnected,
    connectionStatus,
    onlineUsers,
    handleTyping,
    getTypingUsers,
    isUserOnline,
    fetchMessages,
    sendMessage,
  };
};