import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Check, X, Clock, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ChatRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

interface ChatRequest {
  id: string;
  sender_id: string;
  message: string;
  compatibility_score: number;
  created_at: string;
  sender: {
    user_id: string;
    first_name: string;
    last_name?: string;
    profile_images?: string[];
    university?: string;
  };
}

const ChatRequestsModal = ({ isOpen, onClose, onNavigate }: ChatRequestsModalProps) => {
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const { userId } = useRequiredAuth();

  useEffect(() => {
    if (isOpen && userId) {
      fetchChatRequests();
    }
  }, [isOpen, userId]);

  const fetchChatRequests = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('chat-request-handler', {
        body: { 
          action: 'get_requests',
          user_id: userId  // Pass Firebase userId directly
        }
      });

      if (error) throw error;
      setRequests(data?.data || []);
    } catch (error: any) {
      console.error("Error fetching chat requests:", error);
      toast({
        title: "Failed to load requests",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, status: 'accepted' | 'declined') => {
    setResponding(requestId);
    try {
      const { data, error } = await supabase.functions.invoke('chat-request-handler', {
        body: {
          action: 'respond_request',
          request_id: requestId,
          status,
          user_id: userId  // Pass Firebase userId directly
        }
      });

      if (error) throw error;

      if (status === 'accepted') {
        toast({
          title: "Request accepted! 🎉",
          description: "Chat room created. You can now start chatting!",
        });
        onNavigate?.('matches');
        onClose();
      } else {
        toast({
          title: "Request declined",
          description: "The request has been declined",
        });
      }

      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error: any) {
      console.error("Error responding to chat request:", error);
      toast({
        title: "Failed to respond",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setResponding(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Chat Requests
            {requests.length > 0 && (
              <Badge variant="secondary">{requests.length}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No chat requests</p>
              <p className="text-sm">Chat requests will appear here when someone wants to connect with you!</p>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {requests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage 
                          src={request.sender.profile_images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.sender.user_id}`} 
                          alt={request.sender.first_name} 
                        />
                        <AvatarFallback>
                          {request.sender.first_name[0]}{request.sender.last_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm">
                            {request.sender.first_name} {request.sender.last_name || ''}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span className="text-xs font-medium text-green-600">
                              {request.compatibility_score}% match
                            </span>
                          </div>
                        </div>

                        {request.sender.university && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {request.sender.university}
                          </p>
                        )}

                        <p className="text-sm text-foreground mb-3 bg-muted/50 rounded-lg p-2">
                          "{request.message}"
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResponse(request.id, 'declined')}
                              disabled={responding === request.id}
                              className="h-8 px-3"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleResponse(request.id, 'accepted')}
                              disabled={responding === request.id}
                              className="h-8 px-3"
                            >
                              {responding === request.id ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                              ) : (
                                <Check className="w-3 h-3 mr-1" />
                              )}
                              Accept
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ChatRequestsModal;