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

export const SocketChatProvider: React.FC<{ children: React.ReactNode }> =  = ({ children }) => {
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

  const connect = useCallback(async () => {
    if (!userId || !user) {
      console.log('🚫 WebSocket: No user authenticated, skipping connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔄 WebSocket: Already connecting or connected');
      return;
    }

    try {
      setConnectionStatus('connecting');
      console.log('🔌 WebSocket: Connecting to chat server...');

      // Get Firebase auth token for WebSocket authentication
      const token = await getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // WebSocket URL - configurable via environment variable
      const wsBaseUrl = import.meta.env.VITE_WEBSOCKET_URL;
      
      // Skip WebSocket connection if no URL is configured
      if (!wsBaseUrl) {
        console.log('�e WebSocket: No VITE_WEBSOCKET_URL configured, using standard chat mode');
        setConnectionStatus('disconnected');
        return;
      }
      
      const wsUrl = `${wsBaseUrl}/chat?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}`;
      
      // Check if WebSocket server is available
      console.log('🔌 WebSocket: Attempting to connect to:', wsBaseUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket: Connected to chat server');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        // Rejoin previously joined rooms
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

        // Attempt to reconnect if not a normal closure and server was previously connected
        if (event.code !== 1000 && reconnectAttempts.current > 0 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 WebSocket: Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (event.code !== 1000 && reconnectAttempts.current === 0) {
          console.log('💡 WebSocket: Server not available, continuing in standard mode');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket: Connection error:', error);
        setConnectionStatus('error');
        
        // Only show error toast if this isn't the first connection attempt
        if (reconnectAttempts.current > 0) {
          toast.error('Chat connection error. Retrying...');
        } else {
          console.log('💡 WebSocket: Server not available, using standard chat mode');
        }
      };

    } catch (error) {
      console.error('❌ WebSocket: Failed to connect:', error);
      setConnectionStatus('error');
      toast.error('Failed to connect to chat server');
    }
  }, [userId, user, getIdToken, handleWebSocketMessage]);

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
              if (!roomTypers.includes(data.userId!)) {
                newMap.set(data.chatRoomId!, [...roomTypers, data.userId!]);
              }
            } else {
              newMap.set(data.chatRoomId!, roomTypers.filter(id => id !== data.userId));
            }
            
            return newMap;
          });
        }
        break;

      case 'user_status':
        if (data.userId) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            if (data.isOnline) {
              newSet.add(data.userId!);
            } else {
              newSet.delete(data.userId!);
            }
            return newSet;
          });
        }
        break;

      case 'error':
        { console.error('❌ WebSocket: Server error:', data.data);
        const errorMessage = (data.data as { message?: string })?.message || 'Chat server error';
        toast.error(errorMessage);
        break; }

      default:
        console.log('📨 WebSocket: Unknown message type:', data.type);
    }
  }, []);

  const disconnect = useCallback(() => {
    console.log('🔌 WebSocket: Disconnecting...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    joinedRooms.current.clear();
  }, []);

  const sendWebSocketMessage = useCallback((chatRoomId: string, message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Silently fail if WebSocket is not available - Supabase will handle message delivery
      return;
    }

    try {
      const messageData: WebSocketMessage = {
        type: 'message',
        chatRoomId,
        message,
        userId,
        timestamp: new Date().toISOString()
      };

      wsRef.current.send(JSON.stringify(messageData));
      console.log('📤 WebSocket: Message sent', messageData);
    } catch (error) {
      console.warn('⚠️ WebSocket: Failed to send message, falling back to Supabase only');
    }
  }, [userId]);

  const joinChatRoom = useCallback((chatRoomId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Silently fail if WebSocket is not available
      return;
    }

    try {
      joinedRooms.current.add(chatRoomId);
      
      const joinData: WebSocketMessage = {
        type: 'join_room',
        chatRoomId,
        userId
      };

      wsRef.current.send(JSON.stringify(joinData));
      console.log('🏠 WebSocket: Joined room', chatRoomId);
    } catch (error) {
      console.warn('⚠️ WebSocket: Failed to join room');
    }
  }, [userId]);

  const leaveChatRoom = useCallback((chatRoomId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Silently fail if WebSocket is not available
      return;
    }

    try {
      joinedRooms.current.delete(chatRoomId);
      
      const leaveData: WebSocketMessage = {
        type: 'leave_room',
        chatRoomId,
        userId
      };

      wsRef.current.send(JSON.stringify(leaveData));
      console.log('🚪 WebSocket: Left room', chatRoomId);
    } catch (error) {
      console.warn('⚠️ WebSocket: Failed to leave room');
    }
  }, [userId]);

  const sendTypingIndicator = useCallback((chatRoomId: string, isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const typingData: WebSocketMessage = {
        type: 'typing',
        chatRoomId,
        userId,
        isTyping
      };

      wsRef.current.send(JSON.stringify(typingData));
    } catch (error) {
      // Silently fail for typing indicators
    }
  }, [userId]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value = {
    isConnected,
    connectionStatus,
    sendWebSocketMessage,
    joinChatRoom,
    leaveChatRoom,
    onlineUsers,
    typingUsers,
    sendTypingIndicator
  };

  return (
    <WebSocketChatContext.Provider value={value}>
      {children}
    </WebSocketChatContext.Provider>
  );
};