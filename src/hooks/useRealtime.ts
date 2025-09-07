import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onError?: (error: any) => void;
}

export const useRealtime = ({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,  
  onDelete,
  onError
}: UseRealtimeOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create channel name with table and optional filter
    const channelName = `realtime-${table}${filter ? `-${filter}` : ''}`;
    
    // Create the channel
    channelRef.current = supabase.channel(channelName);

    // Set up postgres changes listener
    const channelWithListener = channelRef.current.on(
      'postgres_changes' as any,
      {
        event,
        schema: 'public',
        table,
        filter
      },
      (payload: any) => {
        console.log(`Realtime ${payload.eventType} on ${table}:`, payload);
        
        try {
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload);
              break;
            case 'UPDATE':
              onUpdate?.(payload);
              break;
            case 'DELETE':
              onDelete?.(payload);
              break;
          }
        } catch (error) {
          console.error('Error handling realtime event:', error);
          onError?.(error);
        }
      }
    );

    // Subscribe to the channel
    channelWithListener.subscribe((status) => {
      console.log(`Realtime subscription status for ${table}:`, status);
    });

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`Unsubscribing from realtime channel: ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, event, filter, onInsert, onUpdate, onDelete, onError]);

  return channelRef.current;
};

// Specialized hooks for common use cases
export const useSwipeRealtime = (userId: string, onNewMatch: (match: any) => void) => {
  return useRealtime({
    table: 'enhanced_matches',
    event: 'INSERT',
    filter: `user1_id=eq.${userId},user2_id=eq.${userId}`,
    onInsert: (payload) => {
      onNewMatch(payload.new);
    }
  });
};

export const useChatRealtime = (userId: string, onNewMessage: (message: any) => void) => {
  return useRealtime({
    table: 'chat_messages_enhanced',
    event: 'INSERT',
    filter: `sender_id=neq.${userId}`, // Only listen to messages not sent by current user
    onInsert: (payload) => {
      onNewMessage(payload.new);
    }
  });
};

export const useLikeRealtime = (userId: string, onNewLike: (like: any) => void) => {
  return useRealtime({
    table: 'enhanced_swipes',
    event: 'INSERT',
    filter: `target_user_id=eq.${userId}`,
    onInsert: (payload) => {
      if (payload.new.direction === 'like') {
        onNewLike(payload.new);
      }
    }
  });
};

export const useNotificationRealtime = (userId: string, onNewNotification: (notification: any) => void) => {
  return useRealtime({
    table: 'notifications',
    event: 'INSERT',
    filter: `user_id=eq.${userId}`,
    onInsert: (payload) => {
      onNewNotification(payload.new);
    }
  });
};