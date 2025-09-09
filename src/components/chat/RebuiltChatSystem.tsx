import { useState } from "react";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";
import { useChat, ChatRoom } from "@/hooks/useChat";
import ChatRoomList from "./ChatRoomList";
import ChatConversation from "./ChatConversation";
import ChatRequestsModal from "@/components/notifications/ChatRequestsModal";

interface RebuiltChatSystemProps {
  onNavigate: (view: string) => void;
  selectedChatId?: string;
}

const RebuiltChatSystem = ({ onNavigate, selectedChatId }: RebuiltChatSystemProps) => {
  const { userId, isLoading: authLoading } = useRequiredAuth();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showChatRequests, setShowChatRequests] = useState(false);
  
  const { 
    chatRooms, 
    messages, 
    loading, 
    sendingMessage,
    fetchMessages, 
    sendMessage 
  } = useChat(userId);

  // Handle authentication loading
  if (authLoading || !userId) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your chat...</p>
        </div>
      </div>
    );
  }

  // Handle room selection from external prop
  if (selectedChatId && !selectedRoom) {
    const room = chatRooms.find(r => r.id === selectedChatId);
    if (room) {
      setSelectedRoom(room);
      fetchMessages(room.id);
    }
  }

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    fetchMessages(room.id);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!selectedRoom) return false;
    return await sendMessage(selectedRoom.id, messageText);
  };

  const handleBack = () => {
    if (selectedRoom) {
      setSelectedRoom(null);
    } else {
      onNavigate('home');
    }
  };

  // Show conversation if a room is selected
  if (selectedRoom) {
    return (
      <ChatConversation
        room={selectedRoom}
        messages={messages}
        currentUserId={userId}
        sendingMessage={sendingMessage}
        onBack={handleBack}
        onSendMessage={handleSendMessage}
      />
    );
  }

  // Show chat rooms list
  return (
    <>
      <ChatRoomList
        chatRooms={chatRooms}
        loading={loading}
        onRoomSelect={handleRoomSelect}
        onBack={handleBack}
        onShowRequests={() => setShowChatRequests(true)}
      />
      
      <ChatRequestsModal 
        isOpen={showChatRequests} 
        onClose={() => setShowChatRequests(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};

export default RebuiltChatSystem;