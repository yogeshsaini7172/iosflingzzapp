import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Crown, MapPin, Users } from "lucide-react";
import { SubscriptionEnforcementService } from "@/services/subscriptionEnforcement";
import { useToast } from "@/hooks/use-toast";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";

interface WhoLikedMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserLike {
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  university: string;
  major?: string;
  profile_images?: string[];
  bio?: string;
  is_mutual_match: boolean;
}

const WhoLikedMeModal = ({ isOpen, onClose }: WhoLikedMeModalProps) => {
  const [likes, setLikes] = useState<UserLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSeeLikes, setCanSeeLikes] = useState(false);
  const { toast } = useToast();
  const { userId } = useRequiredAuth();

  useEffect(() => {
    if (isOpen) {
      fetchLikes();
    }
  }, [isOpen]);

  const fetchLikes = async () => {
    try {
      setLoading(true);
      
      // Check permission first
      const canSee = await SubscriptionEnforcementService.checkActionPermission('see_who_liked');
      setCanSeeLikes(canSee);
      
      if (canSee) {
        const result = await SubscriptionEnforcementService.getWhoLikedMe();
        if (result.success && result.data) {
          setLikes(result.data.users || []);
        } else {
          console.error("Failed to fetch likes:", result.error);
          setLikes([]);
        }
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
      setLikes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (userLike: UserLike) => {
    if (!userId) return;
    
    try {
      const result = await SubscriptionEnforcementService.processSwipe(userLike.user_id, 'right');
      
      if (result.success && result.data) {
        // Check if it was a mutual match by looking at the response
        const wasMatch = result.data.plan && result.data.daily_swipes_used > 0;
        
        if (wasMatch) {
          toast({
            title: "Like sent! ❤️",
            description: `Your like was sent to ${userLike.first_name}`,
          });
        } else {
          toast({
            title: "Like sent! ❤️",
            description: `Your like was sent to ${userLike.first_name}`,
          });
        }
        
        // Refresh the likes list
        fetchLikes();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send like",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error liking back:", error);
      toast({
        title: "Error",
        description: "Failed to send like",
        variant: "destructive"
      });
    }
  };

  const renderUpgradePrompt = () => (
    <div className="text-center py-8">
      <div className="mb-6">
        <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">See Who Likes You</h3>
        <p className="text-muted-foreground mb-4">
          Upgrade to premium to see who has liked your profile
        </p>
      </div>
      <Button className="bg-gradient-primary" onClick={() => window.location.hash = 'upgrade'}>
        <Crown className="w-4 h-4 mr-2" />
        Upgrade to Premium
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Who Liked You
            {canSeeLikes && likes.length > 0 && (
              <Badge variant="secondary">{likes.length}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !canSeeLikes ? (
            renderUpgradePrompt()
          ) : likes.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Likes Yet</h3>
              <p className="text-muted-foreground">
                Keep using the app - someone special will find you soon!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {likes.map((userLike) => (
                <Card key={userLike.user_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage 
                          src={userLike.profile_images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userLike.user_id}`} 
                          alt={userLike.first_name} 
                        />
                        <AvatarFallback>
                          {userLike.first_name[0]}{userLike.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {userLike.first_name}, {userLike.age}
                          </h3>
                          {userLike.is_mutual_match && (
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              <Heart className="w-3 h-3 mr-1" />
                              Match
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{userLike.major || "Student"} at {userLike.university}</span>
                        </div>
                        
                        {userLike.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {userLike.bio}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onClose();
                            // Navigate to swipe page to view profile
                            window.location.hash = 'swipe';
                          }}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                        {userLike.is_mutual_match && (
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => {
                              onClose();
                              // Navigate to chat for matches
                              window.location.hash = 'chat';
                            }}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                        )}
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

export default WhoLikedMeModal;