import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Ghost, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileModalProps {
  profile: any;
  isOpen: boolean;
  onClose: () => void;
  onChat?: (profileId: string) => void;
}

const ProfileModal = ({ profile, isOpen, onClose, onChat }: ProfileModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

    const getCurrentUserId = () => {
      // Bypass auth - use default user ID for database operations
      return '11111111-1111-1111-1111-111111111001'; // Default Alice user
    };

  const handleInteraction = async (type: 'like' | 'ghost' | 'bench') => {
    setIsLoading(true);
    const userId = getCurrentUserId();

    try {
      if (type === 'like') {
        // Route likes through the edge function so the server creates matches/chats/notifications
        const { data: resp, error: invokeError } = await supabase.functions.invoke('enhanced-swipe-action', {
          body: {
            user_id: userId,
            target_user_id: profile.user_id,
            direction: 'right',
          },
        });

        if (invokeError) throw invokeError;

        if (resp?.matched) {
          toast({
            title: "It's a Match! 🎉",
            description: "You can now start chatting!",
          });
        } else {
          toast({
            title: "Liked!",
            description: "Your interest has been sent.",
          });
        }
      } else {
        // Handle ghost/bench
        const expiresAt = type === 'ghost' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          : null; // bench has no expiry

        const { error } = await supabase
          .from("user_interactions")
          .upsert({
            user_id: userId,
            target_user_id: profile.user_id,
            interaction_type: type,
            expires_at: expiresAt
          });

        if (error) throw error;

        toast({
          title: type === 'ghost' ? "Ghosted" : "Benched",
          description: type === 'ghost' 
            ? "User added to ghost list for 30 days"
            : "User added to bench - you can chat anytime",
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = () => {
    if (onChat) {
      onChat(profile.user_id);
      onClose();
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {profile.first_name} {profile.last_name}, {profile.age || 22}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Image */}
          <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
            {profile.profile_images && profile.profile_images.length > 0 ? (
              <img 
                src={profile.profile_images[0]} 
                alt={profile.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Photo
              </div>
            )}
          </div>

          {/* Basic Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">University</h4>
                  <p className="text-sm text-muted-foreground">{profile.university}</p>
                </div>
                <div>
                  <h4 className="font-semibold">QCS Score</h4>
                  <p className="text-sm text-muted-foreground">{profile.total_qcs || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {profile.bio && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">About</h4>
                <p className="text-sm">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compatibility Scores */}
          {(profile.compatibility_score || profile.physical_score || profile.mental_score) && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3">Compatibility</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {profile.compatibility_score && (
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {profile.compatibility_score}%
                      </div>
                      <div className="text-xs text-muted-foreground">Overall</div>
                    </div>
                  )}
                  {profile.physical_score && (
                    <div>
                      <div className="text-2xl font-bold text-blue-500">
                        {profile.physical_score}%
                      </div>
                      <div className="text-xs text-muted-foreground">Physical</div>
                    </div>
                  )}
                  {profile.mental_score && (
                    <div>
                      <div className="text-2xl font-bold text-purple-500">
                        {profile.mental_score}%
                      </div>
                      <div className="text-xs text-muted-foreground">Mental</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleInteraction('like')}
              disabled={isLoading}
              className="flex-1 bg-gradient-primary"
            >
              <Heart className="w-4 h-4 mr-2" />
              Like
            </Button>
            
            {onChat && (
              <Button
                onClick={handleChat}
                variant="outline"
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            )}
            
            <Button
              onClick={() => handleInteraction('ghost')}
              disabled={isLoading}
              variant="outline"
              size="icon"
            >
              <Ghost className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={() => handleInteraction('bench')}
              disabled={isLoading}
              variant="outline"
              size="icon"
            >
              <Users className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;