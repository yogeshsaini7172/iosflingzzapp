import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

// Define the shape of the context's public interface
interface SocketChatContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (chatRoomId: string, message: string) => void;
  joinChatRoom: (chatRoomId: string) => void;
  leaveChatRoom: (chatRoomId: string) => void;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string[]>;
  sendTypingIndicator: (chatRoomId: string, isTyping: boolean) => void;
  onMessage: (callback: (data: any) => void) => void;
  offMessage: (callback: (data: any) => void) => void;
  emitEvent: (event: string, data: any) => void;
  onEvent: (event: string, callback: (data: any) => void) => void;
  offEvent: (event: string, callback: (data: any) => void) => void;
}

// Create the context
const SocketChatContext = createContext<SocketChatContextType | undefined>(undefined);

// **THIS IS THE CORRECTED HOOK NAME TO MATCH YOUR NEW STRUCTURE**
export const useSocketChat = () => {
  const context = useContext(SocketChatContext);
  if (context === undefined) {
    throw new Error('useSocketChat must be used within a SocketChatProvider');
  }
  return context;
};

// Define props for the provider component
interface SocketChatProviderProps {
  children: ReactNode;
}

export const SocketChatProvider: React.FC<SocketChatProviderProps> = ({ children }) => {
  const { user, userId, getIdToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map());
  
  const socketRef = useRef<Socket | null>(null);
  const joinedRooms = useRef<Set<string>>(new Set());
  const messageCallbacks = useRef<Set<(data: any) => void>>(new Set());

  // --- Main connection logic ---
  const connect = useCallback(async () => {
    if (!userId || !user || socketRef.current?.connected) return;

    // Check if socket URL is available
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.PROD ? 'https://fllings-socket-server.onrender.com' : 'http://localhost:3002');
    
    console.log('🔍 Environment check:', {
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
      finalSocketUrl: socketUrl,
      allEnvVars: import.meta.env
    });
    
    if (!socketUrl) {
      console.log('No socket URL configured, chat will work without real-time features');
      setConnectionStatus('disconnected');
      return;
    }

    try {
      setConnectionStatus('connecting');
      const token = await getIdToken();
      if (!token) throw new Error('No authentication token available');
      
      socketRef.current = io(socketUrl, {
        auth: { token, userId }, // Send token and userId for server-side authentication
        transports: ['websocket', 'polling'], // Include polling as fallback
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true,
      });

      // --- Core Socket Event Listeners ---
      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Socket connected successfully to:', socketUrl);
        setIsConnected(true);
        setConnectionStatus('connected');
        toast.success('Chat connected!');
        // Re-join all previously joined rooms upon successful reconnection
        joinedRooms.current.forEach(roomId => {
          socket.emit('join_room', { chatRoomId: roomId, userId });
        });
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected from:', socketUrl);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        toast.info('Chat disconnected.');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.log('Attempted connection to:', socketUrl);
        setConnectionStatus('error');
        setIsConnected(false);
        console.log('Falling back to standard chat mode without real-time features');
        toast.warning('Real-time chat unavailable, using standard mode');
      });

      // --- Custom Application Event Listeners ---
      
      // Listener for incoming messages
      socket.on('message', (data) => {
        console.log('📨 Received message via socket:', data);
        messageCallbacks.current.forEach(callback => callback(data));
      });

      // Listener for message errors
      socket.on('message_error', (error) => {
        console.error('❌ Message error from server:', error);
        toast.error('Failed to send message', { description: error.message });
      });

      // Listener for updates to the list of online users
      socket.on('update_online_users', (onlineUserIds: string[]) => {
        setOnlineUsers(new Set(onlineUserIds));
      });

      // Listener for when a user starts typing
      socket.on('typing_started', ({ chatRoomId, userId: typingUserId }) => {
        setTypingUsers(prev => {
          const newTypingUsers = new Map(prev);
          const usersInRoom = newTypingUsers.get(chatRoomId) || [];
          if (!usersInRoom.includes(typingUserId)) {
            newTypingUsers.set(chatRoomId, [...usersInRoom, typingUserId]);
          }
          return newTypingUsers;
        });
      });
      
      // Listener for when a user stops typing
      socket.on('typing_stopped', ({ chatRoomId, userId: typingUserId }) => {
        setTypingUsers(prev => {
          const newTypingUsers = new Map(prev);
          const usersInRoom = newTypingUsers.get(chatRoomId) || [];
          newTypingUsers.set(chatRoomId, usersInRoom.filter(id => id !== typingUserId));
          return newTypingUsers;
        });
      });

    } catch (error) {
      console.error('Socket connection failed:', error);
      setConnectionStatus('disconnected');
      console.log('Chat will work without real-time features');
    }
  }, [userId, user, getIdToken]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  useEffect(() => {
    if (user && userId) {
      connect();
    } else {
      disconnect();
    }
    // The returned function is a cleanup function that runs on component unmount
    return () => {
        disconnect();
    };
  }, [user, userId, connect, disconnect]);

  // --- Public Methods ---

  const sendMessage = useCallback((chatRoomId: string, message: string) => {
    console.log('🔄 Attempting to send message:', { chatRoomId, message, userId, connected: socketRef.current?.connected });
    
    if (!socketRef.current) {
      console.error('❌ Socket not initialized');
      return;
    }
    
    if (!socketRef.current.connected) {
      console.error('❌ Socket not connected');
      return;
    }
    
    if (!userId) {
      console.error('❌ No userId available');
      return;
    }
    
    if (!message.trim()) {
      console.error('❌ Empty message');
      return;
    }
    
    console.log('✅ Sending message via socket:', { chatRoomId, message, userId });
    socketRef.current.emit('message', { chatRoomId, message, userId });
  }, [userId]);

  const joinChatRoom = useCallback((chatRoomId: string) => {
    joinedRooms.current.add(chatRoomId);
    socketRef.current?.emit('join_room', { chatRoomId, userId });
  }, [userId]);

  const leaveChatRoom = useCallback((chatRoomId: string) => {
    joinedRooms.current.delete(chatRoomId);
    socketRef.current?.emit('leave_room', { chatRoomId, userId });
  }, [userId]);

  const sendTypingIndicator = useCallback((chatRoomId: string, isTyping: boolean) => {
    const event = isTyping ? 'typing_started' : 'typing_stopped';
    socketRef.current?.emit(event, { chatRoomId, userId });
  }, [userId]);

  const onMessage = useCallback((callback: (data: any) => void) => {
    messageCallbacks.current.add(callback);
  }, []);

  const offMessage = useCallback((callback: (data: any) => void) => {
    messageCallbacks.current.delete(callback);
  }, []);
  
  // Generic event emitter and listeners for flexibility
  const emitEvent = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const onEvent = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
  }, []);

  const offEvent = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.off(event, callback);
  }, []);

  // The value provided to child components
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
    offMessage,
    emitEvent,
    onEvent,
    offEvent
  };

  return (
    <SocketChatContext.Provider value={value}>
      {children}
    </SocketChatContext.Provider>
  );
};