import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from './useRealtime';
import { useRequiredAuth } from './useRequiredAuth';
import { toast } from '@/hooks/use-toast';

export const useMatchNotifications = () => {
  const { userId } = useRequiredAuth();

  // Listen for new matches
  useRealtime({
    table: 'enhanced_matches',
    event: 'INSERT',
    filter: `user1_id=eq.${userId},user2_id=eq.${userId}`,
    onInsert: async (payload) => {
      const match = payload.new;
      const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
      
      try {
        // Get the other user's profile for the notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, profile_images')
          .eq('user_id', otherUserId)
          .single();

        if (profile) {
          // Create notification in database
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'new_match',
              title: 'New Match! 💕',
              message: `You matched with ${profile.first_name}! Start chatting now.`,
              data: { 
                match_id: match.id,
                other_user_id: otherUserId,
                chat_room_id: match.chat_room_id
              }
            });

          // Show immediate toast
          toast({
            title: "It's a Match! 💕",
            description: `You and ${profile.first_name} liked each other!`,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error creating match notification:', error);
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
              // Create notification in database
              await supabase
                .from('notifications')
                .insert({
                  user_id: userId,
                  type: 'new_message',
                  title: 'New Message 💬',
                  message: `${senderProfile.first_name}: ${message.message_text.slice(0, 50)}${message.message_text.length > 50 ? '...' : ''}`,
                  data: { 
                    chat_room_id: message.chat_room_id,
                    sender_id: message.sender_id
                  }
                });

              // Show immediate toast
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