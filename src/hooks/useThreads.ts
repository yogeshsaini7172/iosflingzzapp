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
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'list' })
      });

      if (!response.ok) throw new Error('Failed to fetch threads');
      const data = await response.json();

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
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          content: content.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to create thread');
      const data = await response.json();

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
      
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management', {
        method: 'POST',
        body: JSON.stringify({
          action,
          threadId
        })
      });

      if (!response.ok) throw new Error(`Failed to ${action} thread`);
      const data = await response.json();

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
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reply',
          threadId,
          content: content.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to reply to thread');
      const data = await response.json();

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
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update',
          threadId,
          content: content.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to update thread');
      const data = await response.json();

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
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management', {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete',
          threadId
        })
      });

      if (!response.ok) throw new Error('Failed to delete thread');
      const data = await response.json();

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