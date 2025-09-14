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
  typingUsers: Map<string, string[]>;
  sendTypingIndicator: (chatRoomId: string, isTyping: boolean) => void;
  onMessage: (callback: (data: any) => void) => void;
  offMessage: (callback: (data: any) => void) => void;
  emitEvent: (event: string, data: any) => void;
  onEvent: (event: string, callback: (data: any) => void) => void;
  offEvent: (event: string, callback: (data: any) => void) => void;
}

const SocketChatContext = createContext<SocketChatContextType | undefined>(undefined);

export const useSocketChat = () => {
  const context = useContext(SocketChatContext);
  if (context === undefined) {
    throw new Error('useSocketChat must be used within a SocketChatProvider');
  }
  return context;
};

export const SocketChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userId, getIdToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map());
  
  const socketRef = useRef<Socket | null>(null);
  const joinedRooms = useRef<Set<string>>(new Set());
  const messageCallbacks = useRef<Set<(data: any) => void>>(new Set());

  const connect = useCallback(async () => {
    if (!userId || !user || socketRef.current?.connected) return;

    try {
      setConnectionStatus('connecting');
      const token = await getIdToken();
      if (!token) throw new Error('No authentication token available');

      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';
      
      socketRef.current = io(socketUrl, {
        auth: { token, userId },
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        joinedRooms.current.forEach(roomId => {
          socketRef.current?.emit('join_room', { chatRoomId: roomId, userId });
        });
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      socketRef.current.on('message', (data) => {
        messageCallbacks.current.forEach(callback => callback(data));
      });

    } catch (error) {
      console.error('Socket connection failed:', error);
      setConnectionStatus('error');
    }
  }, [userId, user, getIdToken]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  useEffect(() => {
    if (user && userId) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [user, userId, connect, disconnect]);

  const sendMessage = useCallback((chatRoomId: string, message: string) => {
    socketRef.current?.emit('message', { chatRoomId, message, userId });
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
    socketRef.current?.emit('typing', { chatRoomId, isTyping, userId });
  }, [userId]);

  const onMessage = useCallback((callback: (data: any) => void) => {
    messageCallbacks.current.add(callback);
  }, []);

  const offMessage = useCallback((callback: (data: any) => void) => {
    messageCallbacks.current.delete(callback);
  }, []);

  const emitEvent = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const onEvent = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
  }, []);

  const offEvent = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.off(event, callback);
  }, []);

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