import { useState } from "react";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";
import { useChatWithWebSocket, ChatRoom } from "@/hooks/useChatWithWebSocket";
import ChatRoomList from "./ChatRoomList";
import ChatConversation from "./ChatConversation";
import ChatRequestsModal from "@/components/notifications/ChatRequestsModal";
import Loader from '@/components/ui/Loader';

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
    wsConnected,
    connectionStatus,
    handleTyping,
    getTypingUsers,
    isUserOnline,
    onlineUsers,
    fetchMessages, 
    sendMessage 
  } = useChatWithWebSocket(userId);

  // Handle authentication loading
  if (authLoading || !userId) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <Loader size={32} />
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

  const handleTypingIndicator = (isTyping: boolean) => {
    if (selectedRoom) {
      handleTyping(selectedRoom.id, isTyping);
    }
  };

  // Get other user ID for the selected room
  const getOtherUserId = (room: ChatRoom) => {
    return room.user1_id === userId ? room.user2_id : room.user1_id;
  };

  // Show conversation if a room is selected
  if (selectedRoom) {
    const otherUserId = getOtherUserId(selectedRoom);
    const typingUsers = getTypingUsers(selectedRoom.id);
    const isOtherUserOnline = isUserOnline(otherUserId);

    return (
      <ChatConversation
        room={selectedRoom}
        messages={messages}
        currentUserId={userId}
        sendingMessage={sendingMessage}
        wsConnected={wsConnected}
        connectionStatus={connectionStatus}
        typingUsers={typingUsers}
        isOtherUserOnline={isOtherUserOnline}
        onBack={handleBack}
        onSendMessage={handleSendMessage}
        onTyping={handleTypingIndicator}
      />
    );
  }

  // Show chat rooms list
  return (
    <>
      <ChatRoomList
        chatRooms={chatRooms}
        loading={loading}
        wsConnected={wsConnected}
        connectionStatus={connectionStatus}
        onlineUsers={onlineUsers}
        currentUserId={userId}
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