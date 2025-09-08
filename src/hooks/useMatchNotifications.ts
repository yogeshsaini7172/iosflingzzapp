import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from './useRealtime';
import { useRequiredAuth } from './useRequiredAuth';
import { toast } from '@/hooks/use-toast';

export const useMatchNotifications = () => {
  const { userId } = useRequiredAuth();

  // Listen for new matches - use two separate subscriptions to cover both user1_id and user2_id positions
  useRealtime({
    table: 'enhanced_matches',
    event: 'INSERT',
    filter: userId ? `user1_id=eq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onInsert: async (payload) => {
      const match = payload.new;
      const isMine = match.user1_id === userId || match.user2_id === userId;
      if (!isMine) return;
      
      const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, profile_images')
          .eq('user_id', otherUserId)
          .single();
        
        if (profile) {
          toast({
            title: "It's a Match! 💕",
            description: `You and ${profile.first_name} liked each other!`,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error handling match notification:', error);
      }
    }
  });

  useRealtime({
    table: 'enhanced_matches',
    event: 'INSERT',
    filter: userId ? `user2_id=eq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onInsert: async (payload) => {
      const match = payload.new;
      const isMine = match.user1_id === userId || match.user2_id === userId;
      if (!isMine) return;
      
      const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, profile_images')
          .eq('user_id', otherUserId)
          .single();
        
        if (profile) {
          toast({
            title: "It's a Match! 💕",
            description: `You and ${profile.first_name} liked each other!`,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error handling match notification:', error);
      }
    }
  });

  // Listen for new messages
  useRealtime({
    table: 'chat_messages_enhanced',
    event: 'INSERT',
    onInsert: async (payload) => {
      const message = payload.new;
      
      // Only show notification if message is not from current user
      if (message.sender_id !== userId) {
        try {
          // Check if user is part of this chat room
          const { data: chatRoom } = await supabase
            .from('chat_rooms')
            .select('user1_id, user2_id')
            .eq('id', message.chat_room_id)
            .single();

          if (chatRoom && (chatRoom.user1_id === userId || chatRoom.user2_id === userId)) {
            // Get sender's profile
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('first_name')
              .eq('user_id', message.sender_id)
              .single();

            if (senderProfile) {
              // Show immediate toast (notification insert handled by edge function)
              toast({
                title: `New message from ${senderProfile.first_name}`,
                description: message.message_text.slice(0, 100),
              });
            }
          }
        } catch (error) {
          console.error('Error creating message notification:', error);
        }
      }
    }
  });
};