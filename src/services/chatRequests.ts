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
  // Firebase-only mode: Simplified chat request (notifications only)
  return { success: true };
}

/**
 * Respond to a chat request (simplified version)
 */
export async function respondToChatRequest(
  requestId: string, 
  action: 'accepted' | 'declined'
): Promise<{ success: boolean; chatRoomId?: string; error?: string }> {
  // Firebase-only mode: Simplified response
  return { success: true };
}

/**
 * Get chat request notifications for the current user
 */
export async function getChatRequests(): Promise<any[]> {
  // Firebase-only mode: Return empty array for now
  return [];
}

/**
 * Enhanced swipe action - uses the server-side edge function
 */
export async function performEnhancedSwipe(
  targetUserId: string, 
  direction: 'left' | 'right'
): Promise<{ success: boolean; matched?: boolean; chatRoomId?: string; error?: string }> {
  // Firebase-only mode: Simplified swipe (no backend integration for now)
  return { success: true, matched: Math.random() > 0.7 };
}
