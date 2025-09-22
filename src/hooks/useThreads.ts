import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import { useRequiredAuth } from './useRequiredAuth';
import { useToast } from './use-toast';

export interface Thread {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  replies_count: number;
  expiresAt: string;
  author?: {
    first_name: string;
    profile_images?: string[];
  };
  replies?: ThreadReply[];
}

export interface ThreadReply {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    first_name: string;
    profile_images?: string[];
  };
}

export const useThreads = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedThreads, setLikedThreads] = useState<Set<string>>(new Set());
  const { userId } = useRequiredAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchThreads();
    if (userId) {
      fetchUserLikes();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('threads-realtime')
      .on('postgres_changes', { schema: 'public', table: 'threads', event: '*' }, () => {
        fetchThreads();
      })
      .on('postgres_changes', { schema: 'public', table: 'thread_likes', event: '*' }, () => {
        fetchUserLikes();
      })
      .on('postgres_changes', { schema: 'public', table: 'thread_replies', event: '*' }, () => {
        fetchThreads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchThreads = async () => {
    try {
      const response = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'list' })
        }
      );

      if (!response.ok) throw new Error('Failed to fetch threads');
      const data = await response.json();
      setThreads((data?.data as any[]) || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('thread_likes')
        .select('thread_id')
        .eq('user_id', userId);

      if (error) throw error;

      const likedIds = new Set(data?.map(like => like.thread_id) || []);
      setLikedThreads(likedIds);
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const createThread = async (content: string): Promise<boolean> => {
    if (!userId || !content.trim()) return false;

    // Check if user already has a thread in last 24h
    const userThreadsLast24h = threads.filter(thread => {
      if (thread.user_id !== userId) return false;
      const threadDate = new Date(thread.created_at);
      return threadDate > new Date(Date.now() - 24 * 60 * 60 * 1000);
    });

    if (userThreadsLast24h.length > 0) {
      toast({
        title: "One Thread Per 24 Hours",
        description: "You can only post one thread every 24 hours. Delete your current thread to post a new one.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const response = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'create', content: content.trim() })
        }
      );

      if (!response.ok) throw new Error('Failed to create thread');
      await response.json();

      toast({
        title: "Thread posted! 🎉",
        description: "Your thread has been shared with the community.",
      });

      await fetchThreads();
      return true;
    } catch (error) {
      console.error('[Threads] Error creating thread:', error);
      toast({
        title: "Error",
        description: "Failed to post thread. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const likeThread = async (threadId: string): Promise<void> => {
    if (!userId) return;

    const isCurrentlyLiked = likedThreads.has(threadId);

    try {
      const action = isCurrentlyLiked ? 'unlike' : 'like';
      const response = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management',
        {
          method: 'POST',
          body: JSON.stringify({ action, threadId })
        }
      );

      if (!response.ok) throw new Error(`Failed to ${action} thread`);
      await response.json();

      const newLikedThreads = new Set(likedThreads);
      if (isCurrentlyLiked) {
        newLikedThreads.delete(threadId);
      } else {
        newLikedThreads.add(threadId);
        toast({ title: "Liked! ❤️", description: "You liked this thread." });
      }
      setLikedThreads(newLikedThreads);

      await fetchThreads();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const replyToThread = async (threadId: string, content: string): Promise<boolean> => {
    if (!userId || !content.trim()) return false;

    try {
      const response = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'reply', threadId, content: content.trim() })
        }
      );

      if (!response.ok) throw new Error('Failed to reply to thread');
      await response.json();

      toast({ title: "Reply posted! 💬", description: "Your reply has been added." });

      await fetchThreads();
      return true;
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateThread = async (threadId: string, content: string): Promise<boolean> => {
    if (!userId || !content.trim()) return false;

    // ✅ Ownership check
    const thread = threads.find(t => t.id === threadId);
    if (!thread) {
      toast({ title: "Error", description: "Thread not found.", variant: "destructive" });
      return false;
    }
    if (thread.user_id !== userId) {
      toast({
        title: "Permission denied",
        description: "You can only edit your own threads.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const response = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'update', threadId, content: content.trim() })
        }
      );

      if (!response.ok) throw new Error('Failed to update thread');
      await response.json();

      toast({ title: "Thread updated! ✏️", description: "Your thread has been updated." });

      await fetchThreads();
      return true;
    } catch (error) {
      console.error('Error updating thread:', error);
      toast({
        title: "Error",
        description: "Failed to update thread. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteThread = async (threadId: string): Promise<boolean> => {
    if (!userId) return false;

    // ✅ Ownership check
    const thread = threads.find(t => t.id === threadId);
    if (!thread) {
      toast({ title: "Error", description: "Thread not found.", variant: "destructive" });
      return false;
    }
    if (thread.user_id !== userId) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own threads.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const response = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'delete', threadId })
        }
      );

      if (!response.ok) throw new Error('Failed to delete thread');
      await response.json();

      toast({ title: "Thread deleted! 🗑️", description: "Your thread has been removed." });

      await fetchThreads();
      return true;
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast({
        title: "Error",
        description: "Failed to delete thread. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    threads,
    loading,
    likedThreads,
    createThread,
    likeThread,
    replyToThread,
    updateThread,
    deleteThread,
    refetch: fetchThreads
  };
};
