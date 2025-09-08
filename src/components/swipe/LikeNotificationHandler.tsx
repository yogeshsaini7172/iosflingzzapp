import { useEffect } from 'react';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import { useRealtime } from '@/hooks/useRealtime';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const LikeNotificationHandler = () => {
  const { userId } = useRequiredAuth();

  // Listen for new likes received
  useRealtime({
    table: 'enhanced_swipes',
    event: 'INSERT',
    filter: userId ? `target_user_id=eq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onInsert: async (payload) => {
      const swipe = payload.new;
      if (swipe.direction === 'right' && swipe.target_user_id === userId) {
        try {
          // Get swiper's profile for notification
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, profile_images')
            .eq('user_id', swipe.user_id)
            .single();

          if (profile) {
            // Create notification
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                type: 'new_like',
                title: 'Someone liked you! 💖',
                message: `${profile.first_name} liked your profile`,
                data: { liker_id: swipe.user_id }
              });

            toast({
              title: "New Like! 💖",
              description: `${profile.first_name} liked your profile!`,
              duration: 4000,
            });
          }
        } catch (error) {
          console.error('Error handling like notification:', error);
        }
      }
    }
  });

  return null; // This is a notification handler, renders nothing
};

export default LikeNotificationHandler;