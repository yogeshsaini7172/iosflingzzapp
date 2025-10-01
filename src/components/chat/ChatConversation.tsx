import { useState, useRef, useEffect } from "react";
import { CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Send, MoreVertical, Phone, Video, Wifi, WifiOff, AlertTriangle, UserX } from "lucide-react";
import { ChatRoom, ChatMessage } from "@/hooks/useChatWithWebSocket";
import { supabase } from "@/integrations/supabase/client";
import { useOptionalAuth } from "@/hooks/useRequiredAuth";
import { useChatNotification } from "@/contexts/ChatNotificationContext";
import { useToast } from "@/hooks/use-toast";
import ChatHeader from "./ChatHeader";

interface ChatConversationProps {
  room: ChatRoom;
  messages: ChatMessage[];
  currentUserId: string;
  sendingMessage: boolean;
  wsConnected?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  typingUsers?: string[];
  isOtherUserOnline?: boolean;
  onBack: () => void;
  onSendMessage: (message: string) => Promise<boolean>;
  onTyping?: (isTyping: boolean) => void;
}

const ChatConversation = ({ 
  room, 
  messages, 
  currentUserId, 
  sendingMessage,
  wsConnected = false,
  connectionStatus = 'disconnected',
  typingUsers = [],
  isOtherUserOnline = false,
  onBack, 
  onSendMessage,
  onTyping
}: ChatConversationProps) => {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { refreshBadge } = useChatNotification();
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Mark messages as seen when component mounts and messages are loaded
  useEffect(() => {
    const markMessagesAsSeen = async () => {
      if (messages.length > 0 && currentUserId) {
        try {
          const { data, error } = await supabase.functions.invoke('chat-management', {
            body: { action: 'mark_seen', chat_room_id: room.id, user_id: currentUserId }
          });
          if (error) throw error;
          if (data.success) {
            console.log('Messages marked as seen');
            // Refresh the chat notification badge
            refreshBadge();
          }
        } catch (error) {
          console.error('Error marking messages as seen:', error);
        }
      }
    };

    markMessagesAsSeen();
  }, [messages.length, currentUserId, room.id, refreshBadge]);

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (!onTyping) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (value.trim()) onTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    const messageToSend = newMessage.trim();
    setNewMessage("");
    if (onTyping) {
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
    const success = await onSendMessage(messageToSend);
    if (!success) setNewMessage(messageToSend);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get the other user's ID using correct column names
  const otherUserId = room.user1_id === currentUserId ? room.user2_id : room.user1_id;
  const isTyping = typingUsers.includes(otherUserId);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleReportUser = async () => {
    if (!currentUserId || !otherUserId) return;

    try {
      // Direct block action (report functionality removed with admin_reports table cleanup)
      const { error } = await supabase
        .from("blocks")
        .insert({
          user_id: currentUserId,
          blocked_user_id: otherUserId
        });

      if (error) throw error;

      toast({
        title: "User Blocked",
        description: "You have blocked this user successfully.",
      });
      
      onBack();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: "Failed to block user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async () => {
    if (!currentUserId || !otherUserId) return;

    try {
      const { error } = await supabase
        .from("blocks")
        .insert({
          user_id: currentUserId,
          blocked_user_id: otherUserId
        });

      if (error) throw error;

      toast({
        title: "User Blocked",
        description: `${room.other_user?.first_name} has been blocked and will no longer be able to contact you.`,
      });
      // Optionally navigate back or close the chat
      onBack();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Block Failed",
        description: "There was an error blocking this user. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-soft">
      <ChatHeader 
        user={room.other_user}
        isOnline={isOtherUserOnline}
        wsConnected={wsConnected}
        onBack={onBack}
        onReportUser={handleReportUser}
        onBlockUser={handleBlockUser}
      />

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Start your conversation with {room.other_user?.first_name}!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              return (
                <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwnMessage ? "bg-gradient-primary text-white" : "bg-card border border-border shadow-soft"}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? "text-white/70" : "text-muted-foreground"}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border shadow-soft rounded-2xl px-4 py-2 max-w-[70%]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {room.other_user?.first_name} is typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-card/90 backdrop-blur-lg border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${room.other_user?.first_name}...`}
              className="pr-12 bg-muted/50 border-0 rounded-full"
              disabled={sendingMessage}
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            size="icon"
            className="rounded-full bg-gradient-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {!wsConnected && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <WifiOff className="h-3 w-3 mr-1" />
              Messages will be delivered when connection is restored
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatConversation;