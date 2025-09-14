import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MoreVertical, Phone, Video, Wifi, WifiOff } from "lucide-react";
import { ChatRoom, ChatMessage } from "@/hooks/useChatWithWebSocket";

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle typing indicators
  const handleInputChange = (value: string) => {
    setNewMessage(value);

    if (!onTyping) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator if user is typing
    if (value.trim() && !typingTimeoutRef.current) {
      onTyping(true);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    
    const messageToSend = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX
    
    // Stop typing indicator
    if (onTyping) {
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
    
    const success = await onSendMessage(messageToSend);
    if (!success) {
      setNewMessage(messageToSend); // Restore message if failed
    }
    
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get other user ID
  const otherUserId = room.user1_id === currentUserId ? room.user2_id : room.user1_id;
  const isTyping = typingUsers.includes(otherUserId);

  // Connection status
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-soft">
      {/* Header */}
      <CardHeader className="flex flex-row items-center space-y-0 pb-4 bg-card/90 backdrop-blur-lg border-b border-border">
        <Button variant="ghost" onClick={onBack} className="mr-3">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="relative mr-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={room.other_user?.profile_images?.[0]} 
              alt={room.other_user?.first_name}
            />
            <AvatarFallback className="bg-gradient-primary text-white">
              {room.other_user?.first_name?.[0]}
              {room.other_user?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          {isOtherUserOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">
              {room.other_user?.first_name} {room.other_user?.last_name}
            </h2>
            {isOtherUserOnline && (
              <Badge variant="secondary" className="text-xs">
                Online
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {room.other_user?.university && (
              <p className="text-xs text-muted-foreground">
                {room.other_user.university}
              </p>
            )}
            {wsConnected ? (
              <Wifi className={`h-3 w-3 ${getConnectionStatusColor()}`} />
            ) : (
              <WifiOff className={`h-3 w-3 ${getConnectionStatusColor()}`} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
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
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? "bg-gradient-primary text-white"
                        : "bg-card border border-border shadow-soft"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.message_text}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? "text-white/70" : "text-muted-foreground"
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
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

      {/* Message Input */}
      <CardContent className="p-4 bg-card/90 backdrop-blur-lg border-t border-border">
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
        
        {/* Connection Status */}
        {!wsConnected && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <WifiOff className="h-3 w-3 mr-1" />
              Messages will be delivered when connection is restored
            </Badge>
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default ChatConversation;