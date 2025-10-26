import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Wifi, WifiOff } from "lucide-react";
import Loader from '@/components/ui/Loader';
import { ChatRoom } from "@/hooks/useChatWithWebSocket";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';

interface ChatRoomListProps {
  chatRooms: ChatRoom[];
  loading: boolean;
  wsConnected?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  onlineUsers?: Set<string>; // Correctly typed as a Set
  currentUserId?: string;
  onRoomSelect: (room: ChatRoom) => void;
  onBack: () => void;
  onShowRequests: () => void;
}

const ChatRoomList = ({
  chatRooms,
  loading,
  wsConnected = false,
  connectionStatus = 'disconnected',
  onlineUsers = new Set(), // Default to an empty Set
  currentUserId = '',
  onRoomSelect,
  onBack,
  onShowRequests
}: ChatRoomListProps) => {
  const { userId } = useRequiredAuth();
  const [requestsCount, setRequestsCount] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchRequestsCount();
    }
  }, [userId]);

  const fetchRequestsCount = async () => {
    if (!userId) return;

    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/chat-request-handler', {
        method: 'POST',
        body: JSON.stringify({
          action: 'get_requests'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat requests');
      }

      const data = await response.json();

      if (data.success) {
        setRequestsCount(data?.data?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching chat requests count:", error);
      setRequestsCount(0);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) return `${Math.floor(diffInHours * 60)}m`;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const isUserOnline = (room: ChatRoom) => {
    const otherUserId = room.user1_id === currentUserId ? room.user2_id : room.user1_id;
    // --- THIS IS THE FIX ---
    // Changed from onlineUsers.includes() to onlineUsers.has()
    return onlineUsers.has(otherUserId);
  };

  const getConnectionStatus = () => {
    if (wsConnected && connectionStatus === 'connected') {
      return { icon: Wifi, text: 'Real-time chat active', color: 'text-green-600' };
    } else if (connectionStatus === 'connecting') {
      return { icon: Wifi, text: 'Connecting...', color: 'text-yellow-600' };
    } else if (connectionStatus === 'error') {
      return { icon: WifiOff, text: 'Connection error', color: 'text-red-600' };
    } else {
      return { icon: WifiOff, text: 'Offline mode', color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="mx-auto mb-4 text-muted-foreground" text="Loading your chats..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center mb-3">
            <Button variant="ghost" onClick={onBack} className="mr-3">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Messages</h1>
              <p className="text-sm text-muted-foreground">
                {chatRooms.length} conversation{chatRooms.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowRequests}
              className="ml-2 relative"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Requests
              {requestsCount > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center"
                >
                  {requestsCount}
                </Badge>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {(() => {
              const status = getConnectionStatus();
              const IconComponent = status.icon;
              return (
                <>
                  <IconComponent className={`h-4 w-4 ${status.color}`} />
                  <span className={status.color}>{status.text}</span>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-3">
        {chatRooms.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground">
              Start matching to begin conversations!
            </p>
          </div>
        ) : (
          chatRooms.map((room) => {
            const isOnline = isUserOnline(room);
            return (
              <Card
                key={room.id}
                className="cursor-pointer hover:shadow-medium transition-all border-0 shadow-card"
                onClick={() => onRoomSelect(room)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={room.other_user?.profile_images?.[0]} 
                          alt={room.other_user?.first_name}
                        />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {room.other_user?.first_name?.[0]}
                          {room.other_user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {room.other_user?.first_name} {room.other_user?.last_name}
                          </h3>
                          {isOnline && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              Online
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(room.last_message_time || room.updated_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {room.last_message || "Start your conversation..."}
                      </p>
                      {room.other_user?.university && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {room.other_user.university}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatRoomList;