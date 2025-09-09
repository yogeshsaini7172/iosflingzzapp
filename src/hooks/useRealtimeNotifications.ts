import { useEffect } from 'react';
import { useRealtime } from './useRealtime';
import { useRequiredAuth } from './useRequiredAuth';
import { toast } from '@/hooks/use-toast';

interface UseRealtimeNotificationsProps {
  onNewLike?: (like: any) => void;
  onNewMatch?: (match: any) => void;
  onNewMessage?: (message: any) => void;
  onNewChatRequest?: (request: any) => void;
  onChatRequestUpdate?: (request: any) => void;
}

export const useRealtimeNotifications = ({
  onNewLike,
  onNewMatch,
  onNewMessage,
  onNewChatRequest,
  onChatRequestUpdate
}: UseRealtimeNotificationsProps = {}) => {
  const { userId } = useRequiredAuth();

  // Listen for new likes/swipes
  useRealtime({
    table: 'enhanced_swipes',
    event: 'INSERT',
    filter: userId ? `target_user_id=eq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onInsert: (payload) => {
      const swipe = payload.new;
      if (swipe.direction === 'right' && swipe.target_user_id === userId) {
        onNewLike?.(swipe);
      }
    }
  });

  // Listen for new matches
  useRealtime({
    table: 'enhanced_matches',
    event: 'INSERT',
    filter: userId ? `user1_id=eq.${userId},user2_id=eq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onInsert: (payload) => {
      const match = payload.new;
      if (match.user1_id === userId || match.user2_id === userId) {
        onNewMatch?.(match);
        toast({
          title: "It's a Match! 🎉",
          description: "You have a new match - start chatting now!",
        });
      }
    }
  });

  // Listen for new chat messages (only from others)
  useRealtime({
    table: 'chat_messages_enhanced',
    event: 'INSERT',
    filter: userId ? `sender_id=neq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onInsert: (payload) => {
      const message = payload.new;
      // Only process if user is part of this chat room
      onNewMessage?.(message);
    }
  });

  // Listen for new chat requests
  useRealtime({
    table: 'chat_requests',
    event: 'INSERT',
    filter: userId ? `recipient_id=eq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onInsert: (payload) => {
      const request = payload.new;
      if (request.recipient_id === userId && request.status === 'pending') {
        onNewChatRequest?.(request);
        toast({
          title: "New Chat Request! 💬",
          description: "Someone wants to connect with you",
        });
      }
    }
  });

  // Listen for chat request updates
  useRealtime({
    table: 'chat_requests',
    event: 'UPDATE',
    filter: userId ? `sender_id=eq.${userId},recipient_id=eq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onUpdate: (payload) => {
      const request = payload.new;
      if (request.sender_id === userId || request.recipient_id === userId) {
        onChatRequestUpdate?.(request);
        
        // Show toast for status changes
        if (request.status === 'accepted' && request.sender_id === userId) {
          toast({
            title: "Chat Request Accepted! 🎉",
            description: "Your chat request was accepted - start chatting now!",
          });
        }
      }
    }
  });

  // Listen for notifications table changes (redundant with useNotifications but useful for debugging)
  useRealtime({
    table: 'notifications',
    event: 'INSERT',
    filter: userId ? `user_id=eq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onInsert: (payload) => {
      console.log('🔔 New notification received via real-time:', payload.new);
    }
  });
};