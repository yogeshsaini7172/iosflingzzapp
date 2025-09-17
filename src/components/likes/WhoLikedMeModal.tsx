import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Crown, MapPin, Eye } from "lucide-react";
import { SubscriptionEnforcementService } from "@/services/subscriptionEnforcement";
import { useToast } from "@/hooks/use-toast";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";
import DetailedProfileModal from '@/components/profile/DetailedProfileModal';
import { supabase } from '@/integrations/supabase/client';

interface WhoLikedMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLike?: () => void; // Callback when a like is successful
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

const WhoLikedMeModal = ({ isOpen, onClose, onLike }: WhoLikedMeModalProps) => {
  const [likes, setLikes] = useState<UserLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSeeLikes, setCanSeeLikes] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserLike | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { toast } = useToast();
  const { userId } = useRequiredAuth();

  // Keep track of users we've liked back (persisted in localStorage)
  const [likedUsers, setLikedUsers] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('likedUsers');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error('Error loading liked users from localStorage:', error);
      return new Set();
    }
  });

  // Save likedUsers to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('likedUsers', JSON.stringify([...likedUsers]));
    } catch (error) {
      console.error('Error saving liked users to localStorage:', error);
    }
  }, [likedUsers]);

  const fetchLikes = useCallback(async () => {
    try {
      if (!userId) {
        console.log('No userId available, skipping fetch');
        return;
      }

      setLoading(true);
      console.log('Fetching likes for user:', userId);
      
      // Check permission first
      const canSee = await SubscriptionEnforcementService.checkActionPermission('see_who_liked');
      setCanSeeLikes(canSee);
      
      if (canSee) {
        console.log('Fetching who liked me data...');
        const result = await SubscriptionEnforcementService.getWhoLikedMe();
        
        if (result.success && result.data) {
          const allUsers = result.data.users || [];
          console.log('Total users who liked you:', allUsers.length);
          console.log('Previously liked users:', likedUsers.size);
          
          // First filter out users we've already liked (from localStorage)
          const initialFilteredUsers = allUsers.filter(user => {
            const isLiked = likedUsers.has(user.user_id);
            if (isLiked) {
              console.log(`Filtering out previously liked user: ${user.user_id}`);
            }
            return !isLiked;
          });
          
          console.log('Users after local filter:', initialFilteredUsers.length);
          
          if (initialFilteredUsers.length > 0) {
            // Get all relevant data in parallel
            const [swipesResult, matchesResult, existingMatchesResult] = await Promise.all([
              // Get users you've swiped right on
              supabase
                .from('enhanced_swipes')
                .select('target_user_id')
                .eq('user_id', userId)
                .eq('direction', 'right'),
              
              // Get all mutual matches
              supabase
                .from('enhanced_matches')
                .select('user1_id, user2_id')
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
                
              // Get existing match records (even if not fully processed)
              supabase
                .from('enhanced_swipes')
                .select('user_id, target_user_id')
                .eq('direction', 'right')
                .eq('target_user_id', userId)
            ]);
              
            // Create sets for efficient lookup
            const usersILiked = new Set(swipesResult.data?.map(swipe => swipe.target_user_id) || []);
            const matchedUsers = new Set(
              (matchesResult.data || []).map(match => 
                match.user1_id === userId ? match.user2_id : match.user1_id
              )
            );
            const mutualLikes = new Set(
              (existingMatchesResult.data || []).map(swipe => swipe.user_id)
            );

            console.log('Users you liked:', usersILiked.size);
            console.log('Matched users:', matchedUsers.size);
            console.log('Mutual likes:', mutualLikes.size);
            
            // Apply additional filters based on database state
            const finalFilteredUsers = initialFilteredUsers.filter(user => 
              !usersILiked.has(user.user_id) && 
              !matchedUsers.has(user.user_id) &&
              !mutualLikes.has(user.user_id)
            );
            
            console.log('Final filtered users count:', finalFilteredUsers.length);
            setLikes(finalFilteredUsers);
          } else {
            console.log('No users remaining after local filter');
            setLikes([]);
          }
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
  }, [userId, likedUsers]);

  // Fetch likes whenever modal opens or when userId changes
  useEffect(() => {
    if (isOpen && userId) {
      fetchLikes();
    }
  }, [isOpen, userId, fetchLikes]);

  const handleLikeBack = async (userLike: UserLike) => {
    if (!userId) {
      console.log('No userId available, cannot process like');
      return { isMatch: false };
    }
    
    try {
      console.log('Processing like back for user:', userLike.user_id);
      
      // Remove from UI immediately and add to liked users set
      setLikes(prev => prev.filter(like => like.user_id !== userLike.user_id));
      
      // Store in localStorage and state that we've liked this user
      const updatedLikedUsers = new Set([...likedUsers, userLike.user_id]);
      localStorage.setItem('likedUsers', JSON.stringify([...updatedLikedUsers]));
      setLikedUsers(updatedLikedUsers);
      
      // Process the swipe through the service - this handles both enforcement and enhanced actions
      const result = await SubscriptionEnforcementService.processSwipe(userLike.user_id, 'right');
      console.log('Swipe result:', result);
      
      if (!result.success) {
        // If swipe failed, show error and revert changes
        console.error('Swipe failed:', result.error);
        
        // Remove from likedUsers set
        setLikedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userLike.user_id);
          return newSet;
        });
        
        // Add back to the UI
        setLikes(prev => [...prev, userLike]);
        
        toast({
          title: "Error",
          description: result.error || "Failed to send like",
          variant: "destructive"
        });
        return { isMatch: false };
      }

      // Check for match from the combined response  
      const isMatchResult = result.success && (
        (result as any).matched === true || 
        (result as any).isMatch === true || 
        (result as any).data?.matched === true
      );
        if (isMatchResult) {
        toast({
          title: "It's a Match! 🎉",
          description: `You and ${userLike.first_name} can now start chatting!`,
        });
        return { isMatch: true };
      } else {
        // Successfully liked but no match yet
        toast({
          title: "Like sent! ❤️",
          description: "You'll be notified if they like you back",
        });
        // Notify parent that a like was successful
        if (onLike) {
          onLike();
        }
        return { isMatch: false };
      }
    } catch (error) {
      console.error("Error liking back:", error);
      // If error occurred, add user back to list and show error
      setLikes(prev => [...prev, userLike]);
      toast({
        title: "Error",
        description: "Failed to send like",
        variant: "destructive"
      });
      return { isMatch: false };
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
          <DialogDescription className="sr-only">
            See who liked your profile and like back to create a match.
          </DialogDescription>
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
                            setSelectedProfile(userLike);
                            setShowProfileModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                        {!userLike.is_mutual_match && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={async () => {
                              const result = await handleLikeBack(userLike);
                              if (result?.isMatch) {
                                setShowProfileModal(false);
                                setSelectedProfile(null);
                              }
                            }}
                          >
                            <Heart className="w-4 h-4 mr-1" />
                            Match
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
      
      {/* Profile Modal */}
      {selectedProfile && (
        <DetailedProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedProfile(null);
          }}
          profile={{
            user_id: selectedProfile.user_id,
            first_name: selectedProfile.first_name,
            last_name: selectedProfile.last_name,
            university: selectedProfile.university,
            profile_images: selectedProfile.profile_images,
            bio: selectedProfile.bio,
            age: selectedProfile.age,
            can_chat: selectedProfile.is_mutual_match,
            compatibility_score: 85,
            total_qcs: 425
          }}
          onSwipe={async (direction) => {
            if (direction === 'right' && !selectedProfile.is_mutual_match) {
              const result = await handleLikeBack(selectedProfile);
              if (result?.isMatch) {
                setShowProfileModal(false);
                setSelectedProfile(null);
              }
            } else if (direction === 'left') {
              setShowProfileModal(false);
              setSelectedProfile(null);
            }
          }}
        />
      )}
    </Dialog>
  );
};

export default WhoLikedMeModal;