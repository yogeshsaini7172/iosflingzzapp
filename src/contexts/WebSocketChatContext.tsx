import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  chatRoomId?: string;
  userId?: string;
  message?: string;
  isTyping?: boolean;
  [key: string]: any;
}

interface SocketChatContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (chatRoomId: string, message: string) => void;
  joinChatRoom: (chatRoomId: string) => void;
  leaveChatRoom: (chatRoomId: string) => void;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string[]>; // chatRoomId -> array of user IDs
  sendTypingIndicator: (chatRoomId: string, isTyping: boolean) => void;
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
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const joinedRooms = useRef<Set<string>>(new Set());

  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'message':
        // Handle incoming message - this will be picked up by Supabase real-time as well
        console.log('📨 WebSocket: New message received', data);
        break;

      case 'typing':
        if (data.chatRoomId && data.userId) {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            const roomTypers = newMap.get(data.chatRoomId!) || [];
            
            if (data.isTyping) {
              // Add user to typing list if not already there
              if (!roomTypers.includes(data.userId!)) {
                newMap.set(data.chatRoomId!, [...roomTypers, data.userId!]);
              }
            } else {
              // Remove user from typing list
              const filtered = roomTypers.filter(id => id !== data.userId);
              if (filtered.length > 0) {
                newMap.set(data.chatRoomId!, filtered);
              } else {
                newMap.delete(data.chatRoomId!);
              }
            }
            
            return newMap;
          });
        }
        break;

      case 'user_online':
        if (data.userId) {
          setOnlineUsers(prev => new Set([...prev, data.userId!]));
        }
        break;

      case 'user_offline':
        if (data.userId) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId!);
            return newSet;
          });
        }
        break;

      case 'pong':
        console.log('💓 WebSocket: Heartbeat pong received');
        break;

      default:
        console.log('🔄 WebSocket: Unknown message type:', data.type);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!userId || !user) {
      console.log('🚫 WebSocket: No user authenticated, skipping connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔄 WebSocket: Already connecting or connected');
      return;
    }

    setConnectionStatus('connecting');
    console.log('🔌 WebSocket: Attempting to connect...');

    try {
      const token = await getIdToken();
      if (!token) {
        console.error('❌ WebSocket: No Firebase token available');
        setConnectionStatus('error');
        return;
      }

      const wsUrl = `wss://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/realtime-chat?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket: Connected successfully');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'ping',
              userId
            }));
          }
        }, 30000);

        // Rejoin all previously joined rooms
        joinedRooms.current.forEach(roomId => {
          wsRef.current?.send(JSON.stringify({
            type: 'join_room',
            chatRoomId: roomId,
            userId
          }));
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ WebSocket: Error parsing message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket: Connection closed', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt reconnection if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          console.log(`🔄 WebSocket: Attempting reconnection in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('❌ WebSocket: Max reconnection attempts reached');
          setConnectionStatus('error');
          toast.error('Connection lost. Please refresh the page.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket: Connection error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('❌ WebSocket: Failed to connect:', error);
      setConnectionStatus('error');
      toast.error('Failed to connect to chat server');
    }
  }, [userId, user, getIdToken, handleWebSocketMessage]);

  const disconnect = useCallback(() => {
    console.log('🔌 WebSocket: Disconnecting...');
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Clear heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    joinedRooms.current.clear();
  }, []);

  const sendWebSocketMessage = useCallback((chatRoomId: string, message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && userId) {
      const messageData = {
        type: 'message',
        chatRoomId,
        message,
        userId,
        timestamp: new Date().toISOString()
      };
      
      wsRef.current.send(JSON.stringify(messageData));
      console.log('📤 WebSocket: Message sent', messageData);
    } else {
      console.warn('⚠️ WebSocket: Cannot send message - not connected');
      toast.error('Not connected to chat server');
    }
  }, [userId]);

  const joinChatRoom = useCallback((chatRoomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && userId) {
      wsRef.current.send(JSON.stringify({
        type: 'join_room',
        chatRoomId,
        userId
      }));
      joinedRooms.current.add(chatRoomId);
      console.log('🚪 WebSocket: Joined room', chatRoomId);
    }
  }, [userId]);

  const leaveChatRoom = useCallback((chatRoomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && userId) {
      wsRef.current.send(JSON.stringify({
        type: 'leave_room',
        chatRoomId,
        userId
      }));
      joinedRooms.current.delete(chatRoomId);
      console.log('🚪 WebSocket: Left room', chatRoomId);
    }
  }, [userId]);

  const sendTypingIndicator = useCallback((chatRoomId: string, isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && userId) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        chatRoomId,
        userId,
        isTyping
      }));
    }
  }, [userId]);

  // Effect to handle connection
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value = {
    isConnected,
    connectionStatus,
    sendMessage: sendWebSocketMessage,
    joinChatRoom,
    leaveChatRoom,
    onlineUsers,
    typingUsers,
    sendTypingIndicator
  };

  return (
    <SocketChatContext.Provider value={value}>
      {children}
    </SocketChatContext.Provider>
  );
};
