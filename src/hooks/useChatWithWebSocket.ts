import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import { useToast } from '@/hooks/use-toast';
import { useSocketChat } from '@/contexts/SocketChatContext';
import { useAuth } from '@/contexts/AuthContext';

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

export const useChatWithWebSocket = (userId: string | null) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();
  const { getIdToken } = useAuth();
  
  const {
    isConnected: wsConnected,
    connectionStatus,
    sendMessage: sendSocketMessage,
    joinChatRoom: wsJoinRoom,
    leaveChatRoom: wsLeaveRoom,
    onlineUsers,
    typingUsers,
    sendTypingIndicator,
    onMessage,
    offMessage
  } = useSocketChat();

  const currentChatRoomId = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    } catch (error: unknown) {
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


  // Enhanced send message with WebSocket support
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
          message: messageText.trim(),
          user_id: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to send message');
      }

      const result = await response.json();
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to send message');
      }
      
      // Manually add the new message to the state to avoid waiting for the subscription
      const newMessage = result.data as ChatMessage;
      setMessages(prev => [...prev, newMessage]);

      // Also send via Socket.IO for instant delivery (if connected)
      if (wsConnected) {
        sendSocketMessage(chatRoomId, messageText.trim());
      }
      
      console.log('✅ Message sent successfully');
      return true;
    } catch (error: unknown) {
      console.error('❌ Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      toast({
        title: "Error", 
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setSendingMessage(false);
    }
  }, [userId, toast, wsConnected, sendSocketMessage]);

  // Handle typing indicators
  const handleTyping = useCallback((chatRoomId: string, isTyping: boolean) => {
    if (!wsConnected || !chatRoomId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    sendTypingIndicator(chatRoomId, isTyping);

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(chatRoomId, false);
      }, 3000);
    }
  }, [wsConnected, sendTypingIndicator]);

  // Get typing users for current room
  const getTypingUsers = useCallback((chatRoomId: string) => {
    if (!chatRoomId) return [];
    return typingUsers.get(chatRoomId) || [];
  }, [typingUsers]);

  // Check if user is online
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  useEffect(() => {
    return () => {
      if (currentChatRoomId.current && wsConnected) {
        wsLeaveRoom(currentChatRoomId.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [wsConnected, wsLeaveRoom]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const messagesChannel = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages_enhanced'
      }, (payload) => {
        console.log('📨 New message received via Supabase:', payload);
        const newMessage = payload.new as ChatMessage;
        
        if (currentChatRoomId.current && newMessage.chat_room_id === currentChatRoomId.current) {
          setMessages(prev => {
            const existsById = prev.find(m => m.id === newMessage.id);
            if (existsById) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
        
        fetchChatRooms();
      })
      .subscribe();

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

  useEffect(() => {
    const handleSocketMessage = (data: unknown) => {
      console.log('🔄 Processing Socket.IO message:', data);
      
      if (!data || typeof data !== 'object') {
        return;
      }

      const messageData = data as {
        userId?: string;
        chatRoomId?: string;
        message?: string;
        timestamp?: string;
      };
      
      if (messageData.userId === userId) {
        return;
      }
      
      if (!messageData.chatRoomId || !messageData.userId || !messageData.message) {
        return;
      }
      
      if (currentChatRoomId.current && messageData.chatRoomId === currentChatRoomId.current) {
        const socketMessage: ChatMessage = {
          id: `socket-${Date.now()}-${Math.random()}`,
          chat_room_id: messageData.chatRoomId,
          sender_id: messageData.userId,
          message_text: messageData.message,
          created_at: messageData.timestamp || new Date().toISOString()
        };

        setMessages(prev => {
          const exists = prev.find(m => 
            m.sender_id === socketMessage.sender_id && 
            m.message_text === socketMessage.message_text &&
            Math.abs(new Date(m.created_at).getTime() - new Date(socketMessage.created_at).getTime()) < 5000
          );
          
          if (exists) {
            return prev;
          }
          
          return [...prev, socketMessage];
        });
      }

      fetchChatRooms();
    };

    onMessage(handleSocketMessage);

    return () => {
      offMessage(handleSocketMessage);
    };
  }, [onMessage, offMessage, fetchChatRooms, userId]);

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
    sendMessage,
    wsConnected,
    connectionStatus,
    handleTyping,
    getTypingUsers,
    isUserOnline,
    onlineUsers: Array.from(onlineUsers)
  };
};