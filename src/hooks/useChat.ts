import { useState, useEffect, useCallback } from 'react';
import { useSocketChat } from '@/contexts/SocketChatContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id?: string;
  room_id?: string;
  sender_id: string;
  content: string;
  created_at?: string;
  match_id?: string;
}

export const useChat = (roomId: string | undefined) => {
  const socketChat = useSocketChat();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    console.log('useChat: Attempting to fetch messages...');
    if (!roomId) {
      console.warn('useChat: No roomId provided, aborting fetch.');
      setLoading(false);
      return;
    }
    if (!user) {
      console.warn('useChat: No user found, aborting fetch.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`useChat: Fetching messages for room: ${roomId}`);

      // Simplified message fetching to avoid type issues
      const response = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      const data = response.data;
      const fetchError = response.error;

      if (fetchError) {
        console.error('useChat: Error fetching messages from Supabase:', fetchError);
        setError('Failed to load chat history.');
        return;
      }

      console.log('useChat: Successfully fetched messages:', data);
      const formattedMessages: ChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id?.toString(),
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        room_id: roomId,
        match_id: msg.match_id?.toString()
      }));

      setMessages(formattedMessages);

    } catch (err) {
      console.error('useChat: An unexpected error occurred:', err);
      setError('An unexpected error occurred.');
    } finally {
      console.log('useChat: Fetch finished, setting loading to false.');
      setLoading(false);
    }
  }, [roomId, user?.uid]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!socketChat || !roomId) return;

    const handleNewMessage = (newMessage: { sender: string; text: string; }) => {
      const formattedMessage: ChatMessage = {
        sender_id: newMessage.sender,
        content: newMessage.text,
        created_at: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, formattedMessage]);
    };

    socketChat.joinChatRoom(roomId);
    socketChat.onMessage(handleNewMessage);

    return () => {
      socketChat.offMessage(handleNewMessage);
      socketChat.leaveChatRoom(roomId);
    };
  }, [socketChat, roomId]);

  const sendMessage = (text: string) => {
    if (!socketChat || !roomId || !text.trim()) {
      return;
    }
    socketChat.sendMessage(roomId, text.trim());
  };

  return { messages, sendMessage, loading, error };
};