import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  author?: {
    first_name: string;
    profile_images?: string[];
  };
}

export interface ThreadReply {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const useThreads = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedThreads, setLikedThreads] = useState<Set<string>>(new Set());
  const { userId } = useRequiredAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Always fetch threads (public via edge function). Likes require user.
    fetchThreads();
    if (userId) {
      fetchUserLikes();
    }
  }, [userId]);

  // Real-time subscriptions for threads
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchThreads = async () => {
    try {
      console.log('[Threads] Fetching list via edge function...');
      const { data, error } = await supabase.functions.invoke('thread-management', {
        body: { action: 'list' }
      });

      if (error) throw error;

      const formattedThreads = (data?.data as any[]) || [];
      console.log('[Threads] Received', formattedThreads.length, 'threads');
      setThreads(formattedThreads);
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

    try {
      const { data, error } = await supabase.functions.invoke('thread-management', {
        body: {
          action: 'create',
          content: content.trim(),
          userId
        }
      });

      if (error) throw error;

      toast({
        title: "Thread posted! 🎉",
        description: "Your thread has been shared with the community.",
      });

      await fetchThreads();
      return true;
    } catch (error) {
      console.error('Error creating thread:', error);
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
      
      const { data, error } = await supabase.functions.invoke('thread-management', {
        body: {
          action,
          threadId,
          userId
        }
      });

      if (error) throw error;

      // Update local state optimistically
      const newLikedThreads = new Set(likedThreads);
      if (isCurrentlyLiked) {
        newLikedThreads.delete(threadId);
      } else {
        newLikedThreads.add(threadId);
        toast({
          title: "Liked! ❤️",
          description: "You liked this thread.",
        });
      }
      setLikedThreads(newLikedThreads);

      // Refresh threads to get updated counts
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
      const { data, error } = await supabase.functions.invoke('thread-management', {
        body: {
          action: 'reply',
          threadId,
          content: content.trim(),
          userId
        }
      });

      if (error) throw error;

      toast({
        title: "Reply posted! 💬",
        description: "Your reply has been added to the thread.",
      });

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

    try {
      const { data, error } = await supabase.functions.invoke('thread-management', {
        body: {
          action: 'update',
          threadId,
          content: content.trim(),
          userId
        }
      });

      if (error) throw error;

      toast({
        title: "Thread updated! ✏️",
        description: "Your thread has been updated successfully.",
      });

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

    try {
      const { data, error } = await supabase.functions.invoke('thread-management', {
        body: {
          action: 'delete',
          threadId,
          userId
        }
      });

      if (error) throw error;

      toast({
        title: "Thread deleted! 🗑️",
        description: "Your thread has been removed.",
      });

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