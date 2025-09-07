import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check, X, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated?: (chatId: string) => void;
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
    last_name: string;
    profile_images?: string[];
    university: string;
  };
}

const ChatRequestsModal = ({ isOpen, onClose, onChatCreated }: ChatRequestsModalProps) => {
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchChatRequests();
    }
  }, [isOpen]);

  const fetchChatRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('chat-request-handler', {
        body: { action: 'get_requests' }
      });

      if (error) throw error;

      setRequests(data?.data || []);
    } catch (error: any) {
      console.error("Error fetching chat requests:", error);
      toast({
        title: "Error",
        description: "Failed to load chat requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      setProcessing(requestId);
      
      const { data, error } = await supabase.functions.invoke('chat-request-handler', {
        body: {
          action: 'respond_request',
          request_id: requestId,
          status
        }
      });

      if (error) throw error;

      if (status === 'accepted') {
        toast({
          title: "Request accepted! 🎉",
          description: "Chat room created. You can start messaging now!",
        });
        
        // Trigger chat creation callback if provided
        onChatCreated?.(data?.data?.id);
      } else {
        toast({
          title: "Request declined",
          description: "The request has been declined.",
        });
      }

      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error: any) {
      console.error("Error responding to chat request:", error);
      toast({
        title: "Error",
        description: "Failed to respond to request",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Chat Requests
            {requests.length > 0 && (
              <Badge variant="secondary">{requests.length}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Chat Requests</h3>
              <p className="text-muted-foreground">
                You don't have any pending chat requests right now.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage 
                          src={request.sender.profile_images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.sender.user_id}`} 
                          alt={request.sender.first_name} 
                        />
                        <AvatarFallback>
                          {request.sender.first_name[0]}{request.sender.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {request.sender.first_name} {request.sender.last_name}
                          </h3>
                          <Badge variant="outline" className="bg-green-100 text-green-700">
                            {request.compatibility_score}% match
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{request.sender.university}</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          "{request.message}"
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleResponse(request.id, 'accepted')}
                          disabled={processing === request.id}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleResponse(request.id, 'declined')}
                          disabled={processing === request.id}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatRequestsModal;