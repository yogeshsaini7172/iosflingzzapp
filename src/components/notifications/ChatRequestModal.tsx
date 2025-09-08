import { useState } from 'react';
import { Send, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import { toast } from '@/hooks/use-toast';

interface Profile {
  user_id: string;
  first_name: string;
  last_name?: string;
  profile_images?: string[];
  university?: string;
  major?: string;
  bio?: string;
}

interface ChatRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

const ChatRequestModal = ({ isOpen, onClose, profile }: ChatRequestModalProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { userId, accessToken } = useRequiredAuth();

  const handleSendRequest = async () => {
    if (!message.trim() || !userId) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-request-handler', {
        body: {
          action: 'send_request',
          recipient_id: profile.user_id,
          message: message.trim()
        },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });

      if (error) throw error;

      toast({
        title: "Chat request sent! 💬",
        description: `Your request has been sent to ${profile.first_name}`,
      });

      onClose();
      setMessage('');
    } catch (error) {
      console.error('Error sending chat request:', error);
      toast({
        title: "Failed to send request",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Send Chat Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile Preview */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage 
                    src={profile.profile_images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`} 
                    alt={profile.first_name} 
                  />
                  <AvatarFallback>
                    {profile.first_name[0]}{profile.last_name?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {profile.first_name} {profile.last_name || ''}
                  </h3>
                  {profile.university && (
                    <p className="text-sm text-muted-foreground">
                      {profile.major ? `${profile.major} at ` : ''}{profile.university}
                    </p>
                  )}
                </div>

                <Heart className="w-5 h-5 text-red-500" />
              </div>
              
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your message:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${profile.first_name}! I'd love to chat with you 😊`}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {message.length}/500 characters
              </p>
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSendRequest} 
              disabled={sending || !message.trim()}
              className="flex-1"
            >
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatRequestModal;