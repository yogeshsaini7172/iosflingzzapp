import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRequiredAuth } from './useRequiredAuth';
import { useRealtime } from './useRealtime';

export const useMatchNotifications = () => {
  const { userId } = useRequiredAuth();
  const queryClient = useQueryClient();

  const handleNewLike = useCallback((payload: any) => {
    if (payload.new) {
      toast.info(`❤️ New like from ${payload.new.swiper_first_name || 'someone'}`);
      queryClient.invalidateQueries({ queryKey: ['whoLikedMe', userId] });
    }
  }, [queryClient, userId]);

  const handleNewMatch = useCallback((payload: any) => {
    if (payload.new) {
      toast.success(`🎉 You've matched with ${payload.new.user2_first_name || 'someone'}!`);
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
    }
  }, [queryClient, userId]);

  useRealtime({
    table: 'enhanced_swipes',
    filter: `target_user_id=eq.${userId}`,
    onInsert: handleNewLike
  });
  
  useRealtime({
    table: 'enhanced_matches',
    filter: `or=(user1_id.eq.${userId},user2_id.eq.${userId})`,
    onInsert: handleNewMatch
  });
};