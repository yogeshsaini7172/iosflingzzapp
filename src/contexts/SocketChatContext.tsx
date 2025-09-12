import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface SocketChatContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (chatRoomId: string, message: string) => void;
  joinChatRoom: (chatRoomId: string) => void;
  leaveChatRoom: (chatRoomId: string) => void;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string[]>; // chatRoomId -> array of user IDs
  sendTypingIndicator: (chatRoomId: string, isTyping: boolean) => void;
  onMessage: (callback: (data: any) => void) => void;
  offMessage: (callback: (data: any) => void) => void;
}

const SocketChatContext = createContext<SocketChatContextType | undefined>(undefined);

export const useSocketChat = () => {
  const context = useContext(SocketChatContext);
  if (context === undefined) {
    throw new Error('useSocketChat must be used within a SocketChatProvider');
  }
  return context;
};

// Keep the old export for backward compatibility
export const useWebSocketChat = useSocketChat;

export const SocketChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userId, getIdToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map());
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const joinedRooms = useRef<Set<string>>(new Set());
  const messageCallbacks = useRef<Set<(data: any) => void>>(new Set());

  const connect = useCallback(async () => {
    if (!userId || !user) {
      console.log('🚫 Socket.IO: No user authenticated, skipping connection');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('🔄 Socket.IO: Already connected');
      return;
    }

    try {
      setConnectionStatus('connecting');
      console.log('🔌 Socket.IO: Connecting to chat server...');

      // Get Firebase auth token for Socket.IO authentication
      const token = await getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Socket.IO URL - configurable via environment variable
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
      
      // Skip Socket.IO connection if no URL is configured
      if (!socketUrl) {
        console.log('💡 Socket.IO: No VITE_SOCKET_URL configured, using standard chat mode');
        setConnectionStatus('disconnected');
        return;
      }
      
      console.log('🔌 Socket.IO: Attempting to connect to:', socketUrl);
      
      // Create Socket.IO connection
      socketRef.current = io(socketUrl, {
        auth: {
          token,
          userId
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000
      });

      // Connection successful
      socketRef.current.on('connect', () => {
        console.log('✅ Socket.IO: Connected to chat server');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Rejoin previously joined rooms
        joinedRooms.current.forEach(roomId => {
          socketRef.current?.emit('join_room', {
            chatRoomId: roomId,
            userId
          });
        });
      });

      // Handle incoming messages
      socketRef.current.on('message', (data) => {
        console.log('📨 Socket.IO: New message received', data);
        // Notify all message callbacks
        messageCallbacks.current.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in message callback:', error);
          }
        });
      });

      // Handle typing indicators
      socketRef.current.on('typing', (data) => {
        if (data.chatRoomId && data.userId) {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            const roomTypers = newMap.get(data.chatRoomId) || [];
            
            if (data.isTyping) {
              if (!roomTypers.includes(data.userId)) {
                newMap.set(data.chatRoomId, [...roomTypers, data.userId]);
              }
            } else {
              newMap.set(data.chatRoomId, roomTypers.filter(id => id !== data.userId));
            }
            
            return newMap;
          });
        }
      });

      // Handle user status updates
      socketRef.current.on('user_status', (data) => {
        if (data.userId) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            if (data.isOnline) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        }
      });

      // Handle connection errors
      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Socket.IO: Connection error:', error);
        setConnectionStatus('error');
        
        // Only show error toast if this isn't the first connection attempt
        if (reconnectAttempts.current > 0) {
          toast.error('Chat connection error. Retrying...');
        } else {
          console.log('💡 Socket.IO: Server not available, using standard chat mode');
        }
      });

      // Handle disconnection
      socketRef.current.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO: Disconnected:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        if (reason === 'io server disconnect') {
          // Server disconnected the client, reconnect manually
          socketRef.current?.connect();
        }
      });

      // Handle server errors
      socketRef.current.on('error', (error) => {
        console.error('❌ Socket.IO: Server error:', error);
        toast.error(error.message || 'Chat server error');
      });

    } catch (error) {
      console.error('❌ Socket.IO: Failed to connect:', error);
      setConnectionStatus('error');
      toast.error('Failed to connect to chat server');
    }
  }, [userId, user, getIdToken]);

  const disconnect = useCallback(() => {
    console.log('🔌 Socket.IO: Disconnecting...');
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    joinedRooms.current.clear();
  }, []);

  const sendMessage = useCallback((chatRoomId: string, message: string) => {
    if (!socketRef.current?.connected) {
      // Silently fail if Socket.IO is not available - Supabase will handle message delivery
      return;
    }

    try {
      socketRef.current.emit('message', {
        chatRoomId,
        message,
        userId,
        timestamp: new Date().toISOString()
      });

      console.log('📤 Socket.IO: Message sent', { chatRoomId, message });
    } catch (error) {
      console.warn('⚠️ Socket.IO: Failed to send message, falling back to Supabase only');
    }
  }, [userId]);

  const joinChatRoom = useCallback((chatRoomId: string) => {
    if (!socketRef.current?.connected) {
      // Silently fail if Socket.IO is not available
      return;
    }

    try {
      joinedRooms.current.add(chatRoomId);
      
      socketRef.current.emit('join_room', {
        chatRoomId,
        userId
      });

      console.log('🏠 Socket.IO: Joined room', chatRoomId);
    } catch (error) {
      console.warn('⚠️ Socket.IO: Failed to join room');
    }
  }, [userId]);

  const leaveChatRoom = useCallback((chatRoomId: string) => {
    if (!socketRef.current?.connected) {
      // Silently fail if Socket.IO is not available
      return;
    }

    try {
      joinedRooms.current.delete(chatRoomId);
      
      socketRef.current.emit('leave_room', {
        chatRoomId,
        userId
      });

      console.log('🚪 Socket.IO: Left room', chatRoomId);
    } catch (error) {
      console.warn('⚠️ Socket.IO: Failed to leave room');
    }
  }, [userId]);

  const sendTypingIndicator = useCallback((chatRoomId: string, isTyping: boolean) => {
    if (!socketRef.current?.connected) {
      return;
    }

    try {
      socketRef.current.emit('typing', {
        chatRoomId,
        userId,
        isTyping
      });
    } catch (error) {
      // Silently fail for typing indicators
    }
  }, [userId]);

  const onMessage = useCallback((callback: (data: any) => void) => {
    messageCallbacks.current.add(callback);
  }, []);

  const offMessage = useCallback((callback: (data: any) => void) => {
    messageCallbacks.current.delete(callback);
  }, []);

  // Connect when user is authenticated
  useEffect(() => {
    if (user && userId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, userId, connect, disconnect]);

  const value = {
    isConnected,
    connectionStatus,
    sendMessage,
    joinChatRoom,
    leaveChatRoom,
    onlineUsers,
    typingUsers,
    sendTypingIndicator,
    onMessage,
    offMessage
  };

  return (
    <SocketChatContext.Provider value={value}>
      {children}
    </SocketChatContext.Provider>
  );
};

// Export both names for compatibility
export const WebSocketChatProvider = SocketChatProvider;