import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Filter, RefreshCw, Settings, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DetailedProfileModal from "@/components/profile/DetailedProfileModal";
import GhostBenchBar from "@/components/ui/ghost-bench-bar";
import EnhancedChatSystem from "@/components/chat/EnhancedChatSystem";

interface SwipeProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  bio: string;
  profile_images: string[];
  university: string;
  interests: string[];
  relationship_goals: string[];
  height: number;
  personality_type: string;
  values: string;
  mindset: string;
  major: string;
  year_of_study: number;
}

interface EnhancedSwipeInterfaceProps {
  onNavigate: (view: string) => void;
}

const EnhancedSwipeInterface = ({ onNavigate }: EnhancedSwipeInterfaceProps) => {
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [matchedChatId, setMatchedChatId] = useState<string>("");
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 30,
    heightMin: 150,
    heightMax: 200,
    datingIntentions: [] as string[]
  });
  const { toast } = useToast();

  const getCurrentUserId = () => {
    return localStorage.getItem("demoUserId") || "11111111-1111-1111-1111-111111111001";
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    const userId = getCurrentUserId();

    console.log("🔍 Starting profile fetch for user:", userId);

    try {
      // First, try direct database query as it's more reliable
      console.log("📊 Using direct database query for profiles");
      
      // Get already swiped users
      const { data: swipedIds, error: swipeError } = await supabase
        .from("enhanced_swipes")
        .select("target_user_id")
        .eq("user_id", userId);

      if (swipeError) {
        console.log("⚠️ No swipe history found (expected for new users):", swipeError);
      }

      // Get ghosted users to exclude
      const { data: ghostedIds } = await supabase
        .from("user_interactions")
        .select("target_user_id")
        .eq("user_id", userId)
        .eq("interaction_type", "ghost")
        .gt("expires_at", new Date().toISOString());

      const excludedIds = [
        userId,
        ...(swipedIds?.map(s => s.target_user_id) || []),
        ...(ghostedIds?.map(g => g.target_user_id) || [])
      ];

      console.log("🚫 Excluding user IDs:", excludedIds);

      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .not("user_id", "in", `(${excludedIds.join(",")})`)
        .limit(10);

      if (error) {
        console.error("❌ Database query error:", error);
        throw error;
      }

      const formattedProfiles = (profilesData || []).map(profile => ({
        ...profile,
        age: profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 22
      }));

      console.log("✅ Fetched profiles via DB:", formattedProfiles.length);
      setProfiles(formattedProfiles);
      
      if (formattedProfiles.length > 0) {
        toast({
          title: "Profiles Loaded!",
          description: `Found ${formattedProfiles.length} profiles to explore`,
        });
      }
    } catch (error: any) {
      console.error("❌ Error fetching feed profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    const userId = getCurrentUserId();

    console.log(`🎯 Processing ${direction} swipe:`, { userId, targetId: currentProfile.user_id });

    try {
      // Use direct database operations for reliability
      const { error: swipeError } = await supabase
        .from("enhanced_swipes")
        .insert({
          user_id: userId,
          target_user_id: currentProfile.user_id,
          direction: direction
        });

      if (swipeError) {
        console.error("❌ Swipe insert error:", swipeError);
        throw swipeError;
      }

      console.log("✅ Swipe recorded successfully");

      if (direction === 'right') {
        // Check if other user already swiped right
        const { data: otherSwipe } = await supabase
          .from("enhanced_swipes")
          .select("*")
          .eq("user_id", currentProfile.user_id)
          .eq("target_user_id", userId)
          .eq("direction", "right")
          .maybeSingle();

        console.log("🔍 Checking for mutual like:", { otherSwipe });

        if (otherSwipe) {
          console.log("🎉 Mutual match found! Creating chat room via function...");

          const { data: roomResp, error: fnError } = await supabase.functions.invoke('chat-management', {
            body: {
              action: 'create_room',
              user_id: userId,
              other_user_id: currentProfile.user_id,
            }
          });

          if (fnError || !roomResp?.data?.id) {
            console.error("❌ Chat room creation via function failed:", fnError || roomResp);
            throw fnError || new Error('Chat room creation failed');
          }

          const chatRoomId = roomResp.data.id as string;
          console.log("✅ Chat room created (function):", chatRoomId);

          toast({
            title: "🎉 It's a Match!",
            description: `You and ${currentProfile.first_name} liked each other! Chat is now available.`,
          });

          setMatchedChatId(chatRoomId);
        } else {
          console.log("💝 Like sent, waiting for match");
          toast({
            title: "Liked!",
            description: `You liked ${currentProfile.first_name}`,
          });
        }
      } else {
        console.log("👋 Profile passed");
        toast({
          title: "Passed",
          description: `You passed on ${currentProfile.first_name}`,
        });
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);
      setCurrentImageIndex(0); // Reset image index for next profile
    } catch (error: any) {
      console.error("❌ Error handling swipe:", error);
      toast({
        title: "Error",
        description: "Failed to process swipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (matchedChatId) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setMatchedChatId("")}
          className="mb-4"
        >
          ← Back to Swiping
        </Button>
        <EnhancedChatSystem onNavigate={onNavigate} selectedChatId={matchedChatId} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gradient-subtle">
        <div className="text-center animate-fade-in">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-6 text-primary animate-pulse-glow" />
          <p className="text-foreground/70 font-modern text-lg">Finding your perfect matches...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="text-center py-20 bg-gradient-subtle min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto space-y-8 animate-elegant-entrance">
          <div className="w-32 h-32 bg-gradient-royal rounded-full flex items-center justify-center mx-auto shadow-premium animate-float">
            <Heart className="w-16 h-16 text-white animate-pulse-glow" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-elegant font-bold text-gradient-primary">No More Elite Profiles!</h2>
            <p className="text-foreground/70 font-modern text-lg leading-relaxed">
              You've explored all premium matches. New exclusive profiles are added daily.
            </p>
          </div>
          <Button 
            onClick={fetchProfiles} 
            className="bg-gradient-primary shadow-premium hover:shadow-glow transition-luxury font-modern font-semibold px-8 py-3 text-lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Discover More
          </Button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  // Reset image index when profile changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentIndex]);

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!currentProfile?.profile_images || currentProfile.profile_images.length <= 1) return;
    
    const totalImages = currentProfile.profile_images.length;
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="max-w-md mx-auto space-y-6 p-4">
        <GhostBenchBar onChatSelected={setMatchedChatId} />
        
        {/* Premium Filters Bar */}
        <div className="flex gap-3 p-2">
          <Button variant="outline" size="sm" className="rounded-full glass-luxury border-primary/30 hover:bg-primary/10 transition-luxury">
            <Filter className="w-4 h-4 mr-2 text-primary" />
            <span className="font-modern">Age ▼</span>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full glass-luxury border-accent/30 hover:bg-accent/10 transition-luxury">
            <span className="font-modern">Height ▼</span>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full glass-luxury border-secondary/30 hover:bg-secondary/10 transition-luxury">
            <span className="font-modern">Dating ▼</span>
          </Button>
        </div>

        {/* Premium Profile Card */}
        <Card className="relative overflow-hidden h-[600px] shadow-premium border-gradient bg-gradient-card hover-elegant">
          <div className="relative h-full">
            {/* Profile Image */}
            <div className="absolute inset-0">
              {/* Tinder-style Progress Bars */}
              {currentProfile?.profile_images && currentProfile.profile_images.length > 1 && (
                <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
                  {currentProfile.profile_images.map((_, index) => (
                    <div 
                      key={index}
                      className="flex-1 h-1 bg-black/20 rounded-full overflow-hidden"
                    >
                      <div 
                        className={`h-full bg-white rounded-full transition-all duration-300 ${
                          index === currentImageIndex ? 'w-full' : index < currentImageIndex ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {currentProfile.profile_images && currentProfile.profile_images.length > 0 ? (
                <div className="relative w-full h-full">
                  <img
                    src={currentProfile.profile_images[currentImageIndex]}
                    alt={`${currentProfile.first_name}'s profile photo ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Invisible tap areas for navigation */}
                  {currentProfile.profile_images.length > 1 && (
                    <>
                      <div 
                        className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
                        onClick={() => handleImageNavigation('prev')}
                      />
                      <div 
                        className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
                        onClick={() => handleImageNavigation('next')}
                      />
                    </>
                  )}

                  {/* Photo count indicator */}
                  {currentProfile.profile_images.length > 1 && (
                    <div className="absolute top-16 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded-full backdrop-blur-sm z-20">
                      {currentImageIndex + 1}/{currentProfile.profile_images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-royal flex items-center justify-center">
                  <div className="text-center text-white animate-fade-in">
                    <div className="text-6xl mb-4">✨</div>
                    <p className="font-elegant text-lg">Premium Profile</p>
                  </div>
                </div>
              )}
              
              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            </div>

            {/* Premium Top Controls */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
              <Button variant="ghost" size="icon" className="glass-luxury text-white hover:bg-white/20 transition-luxury shadow-soft">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="glass-luxury text-white hover:bg-white/20 transition-luxury shadow-soft">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>

            {/* Premium Profile Info */}
            <div className="absolute bottom-24 left-6 right-6 text-white z-10 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-4xl font-elegant font-bold tracking-tight">
                  {currentProfile.first_name}
                </h2>
                {currentProfile.age <= 20 && (
                  <Badge className="bg-gradient-secondary text-black border-0 shadow-gold animate-shimmer">
                    <span className="font-modern font-semibold">New Elite</span>
                  </Badge>
                )}
              </div>
              
              <p className="text-lg opacity-90 mb-4 font-modern">
                she/her • {currentProfile.age} years
              </p>

              <div 
                className="cursor-pointer hover-luxury glass-dark-luxury p-4 rounded-xl border border-white/20 transition-luxury"
                onClick={() => setShowDetailedProfile(true)}
              >
                <p className="text-lg mb-2 font-elegant text-gradient-gold">Together, we could</p>
                <p className="text-xl font-medium opacity-90 font-modern">
                  {currentProfile.bio || "explore new adventures together..."}
                </p>
              </div>
            </div>

            {/* Premium Heart Button */}
            <Button
              onClick={() => setShowDetailedProfile(true)}
              size="icon"
              className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-primary shadow-premium hover:shadow-glow transition-luxury animate-pulse-glow z-10"
            >
              <Heart className="w-7 h-7 text-white" />
            </Button>
          </div>
        </Card>

        {/* Premium Action Buttons */}
        <div className="flex justify-center gap-8 pt-6">
          <Button
            onClick={() => handleSwipe('left')}
            size="icon"
            variant="outline"
            className="w-16 h-16 rounded-full border-2 glass-luxury border-red-300/50 hover:bg-red-50 hover:border-red-400 hover:shadow-soft transition-luxury group"
          >
            <X className="w-7 h-7 text-red-500 group-hover:scale-110 transition-all" />
          </Button>
          
          <Button
            onClick={() => handleSwipe('right')}
            size="icon"
            className="w-16 h-16 rounded-full bg-gradient-rose shadow-premium hover:shadow-glow transition-luxury group animate-pulse-glow"
          >
            <Heart className="w-7 h-7 text-white group-hover:scale-110 transition-all" />
          </Button>
        </div>
      </div>

      {/* Detailed Profile Modal */}
      <DetailedProfileModal
        profile={currentProfile}
        isOpen={showDetailedProfile}
        onClose={() => setShowDetailedProfile(false)}
        onSwipe={handleSwipe}
      />
    </div>
  );
};

export default EnhancedSwipeInterface;