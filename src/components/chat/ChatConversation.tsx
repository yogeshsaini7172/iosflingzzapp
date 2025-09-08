import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, MoreVertical, Phone, Video } from "lucide-react";
import { ChatRoom, ChatMessage } from "@/hooks/useChat";

interface ChatConversationProps {
  room: ChatRoom;
  messages: ChatMessage[];
  currentUserId: string;
  sendingMessage: boolean;
  onBack: () => void;
  onSendMessage: (message: string) => Promise<boolean>;
}

const ChatConversation = ({ 
  room, 
  messages, 
  currentUserId, 
  sendingMessage,
  onBack, 
  onSendMessage 
}: ChatConversationProps) => {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    
    const messageToSend = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX
    
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

  return (
    <div className="flex flex-col h-screen bg-gradient-soft">
      {/* Header */}
      <CardHeader className="flex flex-row items-center space-y-0 pb-4 bg-card/90 backdrop-blur-lg border-b border-border">
        <Button variant="ghost" onClick={onBack} className="mr-3">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <Avatar className="w-10 h-10 mr-3">
          <AvatarImage 
            src={room.other_user?.profile_images?.[0]} 
            alt={room.other_user?.first_name}
          />
          <AvatarFallback className="bg-gradient-primary text-white">
            {room.other_user?.first_name?.[0]}
            {room.other_user?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold">
            {room.other_user?.first_name} {room.other_user?.last_name}
          </h2>
          {room.other_user?.university && (
            <p className="text-xs text-muted-foreground">
              {room.other_user.university}
            </p>
          )}
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
              onChange={(e) => setNewMessage(e.target.value)}
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
      </CardContent>
    </div>
  );
};

export default ChatConversation;