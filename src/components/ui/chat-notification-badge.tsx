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
    fetchChatCounts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchChatCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchChatCounts = async () => {
    if (!userId || !isAuthenticated) return;
    
    try {
      // Get total chat rooms
      const { data: rooms, error } = await supabase
        .from("chat_rooms")
        .select("id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) throw error;

      setChatCount(rooms?.length || 0);
      
      // For demo purposes, set unread count (in real app, this would be based on actual unread messages)
      setUnreadCount(Math.min(3, rooms?.length || 0));
    } catch (error) {
      console.error("Error fetching chat counts:", error);
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