import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOptionalAuth } from "@/hooks/useRequiredAuth";

interface ChatNotificationBadgeProps {
  onClick: () => void;
  className?: string;
}

const ChatNotificationBadge = ({ onClick, className }: ChatNotificationBadgeProps) => {
  const [chatCount, setChatCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userId, isAuthenticated } = useOptionalAuth();

  useEffect(() => {
    if (userId && isAuthenticated) {
      fetchChatCounts();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchChatCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, isAuthenticated]);

  const fetchChatCounts = async () => {
    if (!userId || !isAuthenticated) return;

    try {
      // Get total chat rooms
      const { data: rooms, error } = await supabase
        .from("chat_rooms")
        .select("id")
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

      if (error) throw error;

      setChatCount(rooms?.length || 0);

      // Get actual unread message count from backend
      const { data: unreadData, error: unreadError } = await supabase.functions.invoke('chat-management', {
        body: { action: 'get_unread_count', user_id: userId }
      });

      if (unreadError) throw unreadError;

      if (unreadData.success) {
        setUnreadCount(unreadData.data || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching chat counts:", error);
      setUnreadCount(0);
    }
  };

  if (chatCount === 0) {
    return (
      <div 
        className={`relative cursor-pointer ${className}`}
        onClick={onClick}
      >
        <MessageCircle className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      onClick={onClick}
    >
      <MessageCircle className="w-5 h-5 text-primary" />
      {unreadCount > 0 && (
        <Badge 
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center"
        >
          {unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default ChatNotificationBadge;