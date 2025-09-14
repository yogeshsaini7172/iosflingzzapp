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
      console.log('💬 Loading previous messages for room:', chatRoomId);
      console.log('🔍 Debug: userId =', userId, 'chatRoomId =', chatRoomId);
      
      // Load previous messages directly from Supabase (schema should be fixed now)
      console.log('🔄 Querying chat_messages_enhanced table...');
      
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages_enhanced')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('❌ Error loading messages:', messagesError);
        console.log('💡 This might mean the schema fix hasn\'t been applied yet');
        console.log('📋 Please run the SQL from manual-schema-fix.sql in Supabase Dashboard');
        
        // Fallback: try the Edge Function approach
        console.log('🔄 Trying Edge Function fallback...');
        try {
          const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/chat-management', {
            method: 'POST',
            body: JSON.stringify({ 
              action: 'get_messages',
              chat_room_id: chatRoomId,
              user_id: userId 
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.success && data?.data) {
              console.log('✅ Loaded messages via Edge Function:', data.data.length);
              setMessages(data.data);
            } else {
              console.log('⚠️ Edge Function returned no messages');
              setMessages([]);
            }
          } else {
            console.log('⚠️ Edge Function failed, using empty messages');
            setMessages([]);
          }
        } catch (edgeFunctionError) {
          console.error('❌ Edge Function also failed:', edgeFunctionError);
          setMessages([]);
        }
      } else {
        console.log('✅ Successfully loaded previous messages:', messages?.length || 0);
        setMessages(messages || []);
        
        // Log first few messages for debugging
        if (messages && messages.length > 0) {
          console.log('📝 Sample messages:', messages.slice(0, 3).map(m => ({
            id: m.id,
            sender: m.sender_id,
            text: m.message_text?.substring(0, 50) + '...',
            time: m.created_at
          })));
        }
      }

      // Join WebSocket room for real-time updates
      if (wsConnected) {
        // Leave previous room if any
        if (currentChatRoomId.current && currentChatRoomId.current !== chatRoomId) {
          wsLeaveRoom(currentChatRoomId.current);
        }
        
        // Join new room
        wsJoinRoom(chatRoomId);
        currentChatRoomId.current = chatRoomId;
      }
      
      console.log('📱 Chat ready with message history and real-time updates!');
    } catch (error: unknown) {
      console.error('❌ Error in fetchMessages:', error);
      console.log('💡 Using empty messages as fallback');
      setMessages([]);
    }
  }, [userId, wsConnected, wsJoinRoom, wsLeaveRoom]);

  // Enhanced send message with WebSocket support
  const sendMessage = useCallback(async (chatRoomId: string, messageText: string) => {
    if (!userId || !messageText.trim()) return false;

    setSendingMessage(true);
    try {
      console.log('📤 Sending message to room:', chatRoomId);
      
      // Send via Edge Function (primary method) - handles authentication properly
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
      
      // Add optimistic message for immediate UI feedback
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}-${Math.random()}`,
        chat_room_id: chatRoomId,
        sender_id: userId,
        message_text: messageText.trim(),
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMessage]);

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

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Send typing indicator
    sendTypingIndicator(chatRoomId, isTyping);

    // If user is typing, set timeout to stop typing indicator
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(chatRoomId, false);
      }, 3000); // Stop typing indicator after 3 seconds
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

  // Leave current room when component unmounts or room changes
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

  // Real-time subscriptions (keeping existing Supabase real-time)
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
        console.log('📨 New message received via Supabase:', payload);
        const newMessage = payload.new as ChatMessage;
        
        // Only add message if it's for the current chat room
        if (currentChatRoomId.current && newMessage.chat_room_id === currentChatRoomId.current) {
          setMessages(prev => {
            // Check for duplicates by ID
            const existsById = prev.find(m => m.id === newMessage.id);
            
            if (existsById) {
              console.log('🔄 Supabase message already exists, skipping');
              return prev;
            }
            
            // Replace optimistic message if it exists
            const optimisticIndex = prev.findIndex(m => 
              m.id.startsWith('temp-') && 
              m.sender_id === newMessage.sender_id && 
              m.message_text === newMessage.message_text &&
              Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000
            );
            
            if (optimisticIndex !== -1) {
              console.log('🔄 Replacing optimistic message with real message');
              const newMessages = [...prev];
              newMessages[optimisticIndex] = newMessage;
              return newMessages;
            }
            
            console.log('✅ Adding Supabase message to conversation');
            return [...prev, newMessage];
          });
        }
        
        // Always refresh chat rooms to update last message
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

  // Handle Socket.IO messages
  useEffect(() => {
    const handleSocketMessage = (data: unknown) => {
      console.log('🔄 Processing Socket.IO message:', data);
      
      // Type guard for Socket.IO message data
      if (!data || typeof data !== 'object') {
        console.warn('🔄 Invalid Socket.IO message data:', data);
        return;
      }

      const messageData = data as {
        userId?: string;
        chatRoomId?: string;
        message?: string;
        timestamp?: string;
      };
      
      // Skip messages from current user (they should already see their own messages via Supabase)
      if (messageData.userId === userId) {
        console.log('🔄 Skipping own message from Socket.IO');
        return;
      }
      
      // Validate required fields
      if (!messageData.chatRoomId || !messageData.userId || !messageData.message) {
        console.warn('🔄 Incomplete Socket.IO message data:', messageData);
        return;
      }
      
      // Only process messages for the current chat room
      if (currentChatRoomId.current && messageData.chatRoomId === currentChatRoomId.current) {
        // Create a message object that matches our ChatMessage interface
        const socketMessage: ChatMessage = {
          id: `socket-${Date.now()}-${Math.random()}`, // Temporary ID until Supabase sync
          chat_room_id: messageData.chatRoomId,
          sender_id: messageData.userId,
          message_text: messageData.message,
          created_at: messageData.timestamp || new Date().toISOString()
        };

        // Add message to current conversation
        setMessages(prev => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.find(m => 
            m.sender_id === socketMessage.sender_id && 
            m.message_text === socketMessage.message_text &&
            Math.abs(new Date(m.created_at).getTime() - new Date(socketMessage.created_at).getTime()) < 5000
          );
          
          if (exists) {
            console.log('🔄 Socket message already exists, skipping');
            return prev;
          }
          
          console.log('✅ Adding Socket.IO message to conversation');
          return [...prev, socketMessage];
        });
      }

      // Always refresh chat rooms to update last message
      fetchChatRooms();
    };

    // Subscribe to Socket.IO messages
    onMessage(handleSocketMessage);

    return () => {
      // Unsubscribe from Socket.IO messages
      offMessage(handleSocketMessage);
    };
  }, [onMessage, offMessage, fetchChatRooms, userId]);

  // Load chat rooms on mount
  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  return {
    // Existing functionality
    chatRooms,
    messages,
    loading,
    sendingMessage,
    fetchChatRooms,
    fetchMessages,
    sendMessage,
    
    // WebSocket enhancements
    wsConnected,
    connectionStatus,
    handleTyping,
    getTypingUsers,
    isUserOnline,
    onlineUsers: Array.from(onlineUsers)
  };
};