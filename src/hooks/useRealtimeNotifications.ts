import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
}

export function useRealtimeNotifications() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let channel: any | null = null;
    let isMounted = true;

    (async () => {
      if (!userId) return;

      // Use Firebase UID directly
      const authedUserId = userId;

      // Fetch initial notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authedUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (isMounted && !error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read_at).length);
      }

      // Set up real-time subscription (only after we have a session)
      channel = supabase
        .channel(`notifications:${authedUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${authedUserId}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;

            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            if (newNotification.type === 'new_match') {
              toast({ title: "🎉 It's a Match!", description: newNotification.message });
            } else if (newNotification.type === 'chat_request') {
              toast({ title: '💬 Chat Request', description: newNotification.message });
            } else if (newNotification.type === 'chat_request_accepted') {
              toast({ title: '✅ Chat Accepted', description: newNotification.message });
            } else {
              toast({ title: newNotification.title, description: newNotification.message });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${authedUserId}`
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev => prev.map(n => n.id === updatedNotification.id ? updatedNotification : n));
            if (updatedNotification.read_at && !payload.old.read_at) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();
    })();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, toast]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}