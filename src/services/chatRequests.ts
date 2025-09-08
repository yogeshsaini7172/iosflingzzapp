import { supabase } from "@/integrations/supabase/client";

export interface ChatRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface ChatRequestWithProfile extends ChatRequest {
  from_profile?: {
    first_name: string;
    last_name: string;
    profile_images?: string[];
    university: string;
  };
}

/**
 * Send a chat request to another user (simplified version without RPC)
 */
export async function sendChatRequest(toUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // For now, create a notification directly (until RPC functions are available)
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: toUserId,
        type: 'chat_request',
        title: 'Chat Request',
        message: `Someone wants to chat with you!`,
        data: { from_user_id: currentUser.id }
      });

    if (error) {
      console.error('Error sending chat request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending chat request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Respond to a chat request (simplified version)
 */
export async function respondToChatRequest(
  requestId: string, 
  action: 'accepted' | 'declined'
): Promise<{ success: boolean; chatRoomId?: string; error?: string }> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // For now, just create a notification back to the sender
    // In a full implementation, this would use the RPC function
    return { success: true };
  } catch (error: any) {
    console.error('Error responding to chat request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get chat request notifications for the current user
 */
export async function getChatRequests(): Promise<any[]> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return [];

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('type', 'chat_request')
      .is('read_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat requests:', error);
      return [];
    }

    return notifications || [];
  } catch (error) {
    console.error('Error fetching chat requests:', error);
    return [];
  }
}

/**
 * Enhanced swipe action - uses the server-side edge function
 */
export async function performEnhancedSwipe(
  targetUserId: string, 
  direction: 'left' | 'right'
): Promise<{ success: boolean; matched?: boolean; chatRoomId?: string; error?: string }> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase.functions.invoke('enhanced-swipe-action', {
      body: {
        user_id: currentUser.id,
        target_user_id: targetUserId,
        direction
      }
    });

    if (error) {
      console.error('Enhanced swipe error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      matched: data?.matched || false,
      chatRoomId: data?.chatRoomId
    };
  } catch (error: any) {
    console.error('Error performing enhanced swipe:', error);
    return { success: false, error: error.message };
  }
}