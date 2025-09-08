import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRequiredAuth } from './useRequiredAuth';
import { useRealtime } from './useRealtime';
import { toast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  type: 'chat_request' | 'chat_request_accepted' | 'new_match' | 'new_message';
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userId } = useRequiredAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const notifs = (data || []).map(n => ({
        ...n,
        type: n.type as 'chat_request' | 'chat_request_accepted' | 'new_match' | 'new_message'
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time notifications
  useRealtime({
    table: 'notifications',
    event: 'INSERT',
    filter: `user_id=eq.${userId}`,
    onInsert: (payload) => {
      const newNotification = payload.new as Notification;
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast({
        title: newNotification.title,
        description: newNotification.message,
      });
    }
  });

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};