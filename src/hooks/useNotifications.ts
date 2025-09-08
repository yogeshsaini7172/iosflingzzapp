import { useState, useEffect } from 'react';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import { useRequiredAuth } from './useRequiredAuth';
import { useRealtime } from './useRealtime';
import { toast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  type: 'chat_request' | 'chat_request_accepted' | 'new_match' | 'new_message' | 'new_like';
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

  // Fetch notifications via Edge Function (works with Firebase-only auth)
  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/notifications-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'list' })
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      const list = (data?.data || []) as any[];
      const notifs = list.map((n) => ({
        ...n,
        type: n.type as 'chat_request' | 'chat_request_accepted' | 'new_match' | 'new_message' | 'new_like',
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read_at).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time notifications (guard with userId check)
  useRealtime({
    table: 'notifications',
    event: 'INSERT',
    filter: userId ? `user_id=eq.${userId}` : 'id=eq.00000000-0000-0000-0000-000000000000',
    onInsert: (payload) => {
      const newNotification = payload.new as Notification;
      // Double-check user_id matches to prevent cross-user notifications
      if (newNotification.user_id === userId) {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast({
          title: newNotification.title,
          description: newNotification.message,
        });
      }
    }
  });

  // Mark notification as read via Edge Function
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/notifications-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'mark_read', notification_id: notificationId })
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read via Edge Function
  const markAllAsRead = async () => {
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/notifications-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'mark_all_read' })
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
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