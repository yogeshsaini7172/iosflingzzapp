import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChatRoom {
  id: string;
  match_id: string;
  user1_id: string;
  user2_id: string;
  updated_at: string;
  other_user?: any;
  last_message?: string;
}

interface Message {
  id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

interface EnhancedChatSystemProps {
  onNavigate: (view: string) => void;
  selectedChatId?: string;
}

const EnhancedChatSystem = ({ onNavigate, selectedChatId }: EnhancedChatSystemProps) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentUserId = () => {
    return localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      const chat = chatRooms.find(c => c.id === selectedChatId);
      if (chat) {
        setSelectedChat(chat);
        fetchMessages(selectedChatId);
      }
    }
  }, [selectedChatId, chatRooms]);

  const fetchChatRooms = async () => {
    const userId = getCurrentUserId();
    
    try {
      const { data: rooms, error } = await supabase
        .from("chat_rooms")
        .select(`
          id,
          match_id,
          user1_id,
          user2_id,
          updated_at
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch other user details for each room
      const roomsWithUsers = await Promise.all(
        (rooms || []).map(async (room) => {
          const otherUserId = room.user1_id === userId ? room.user2_id : room.user1_id;
          
          const { data: otherUser } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name, profile_images")
            .eq("user_id", otherUserId)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from("chat_messages_enhanced")
            .select("message_text")
            .eq("chat_room_id", room.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...room,
            other_user: otherUser,
            last_message: lastMessage?.message_text || "No messages yet"
          };
        })
      );

      setChatRooms(roomsWithUsers);
    } catch (error: any) {
      console.error("Error fetching chat rooms:", error);
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async (chatRoomId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages_enhanced")
        .select("*")
        .eq("chat_room_id", chatRoomId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setIsLoading(true);
    const userId = getCurrentUserId();

    try {
      const { error } = await supabase
        .from("chat_messages_enhanced")
        .insert({
          chat_room_id: selectedChat.id,
          sender_id: userId,
          message_text: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedChat.id);
      fetchChatRooms(); // Refresh to update last message and timestamp
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (selectedChat) {
    const currentUserId = getCurrentUserId();
    
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedChat(null)}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-8 h-8 mr-3">
            <AvatarImage src={selectedChat.other_user?.profile_images?.[0]} />
            <AvatarFallback>
              {selectedChat.other_user?.first_name?.[0]}
              {selectedChat.other_user?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">
            {selectedChat.other_user?.first_name} {selectedChat.other_user?.last_name}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUserId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender_id === currentUserId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.message_text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !newMessage.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle>Chats</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {chatRooms.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No chats yet. Start matching to begin conversations!
              </p>
            ) : (
              chatRooms.map((room) => (
                <Card
                  key={room.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedChat(room)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={room.other_user?.profile_images?.[0]} />
                      <AvatarFallback>
                        {room.other_user?.first_name?.[0]}
                        {room.other_user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">
                        {room.other_user?.first_name} {room.other_user?.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {room.last_message}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(room.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EnhancedChatSystem;