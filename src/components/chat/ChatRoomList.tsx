import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { ChatRoom } from "@/hooks/useChat";

interface ChatRoomListProps {
  chatRooms: ChatRoom[];
  loading: boolean;
  onRoomSelect: (room: ChatRoom) => void;
  onBack: () => void;
  onShowRequests: () => void;
}

const ChatRoomList = ({ chatRooms, loading, onRoomSelect, onBack, onShowRequests }: ChatRoomListProps) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return `${Math.floor(diffInHours / 24)}d`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center">
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
            className="ml-2"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Requests
          </Button>
        </div>
      </div>

      {/* Chat Rooms List */}
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
          chatRooms.map((room) => (
            <Card
              key={room.id}
              className="cursor-pointer hover:shadow-medium transition-all border-0 shadow-card"
              onClick={() => onRoomSelect(room)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
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
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">
                        {room.other_user?.first_name} {room.other_user?.last_name}
                      </h3>
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
          ))
        )}
      </div>
    </div>
  );
};

export default ChatRoomList;