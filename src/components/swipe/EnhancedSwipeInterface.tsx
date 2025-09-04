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
    return localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
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
          console.log("🎉 Mutual match found! Creating match record...");
          
          // Create match record
          const user1_id = userId < currentProfile.user_id ? userId : currentProfile.user_id;
          const user2_id = userId < currentProfile.user_id ? currentProfile.user_id : userId;

          const { data: match, error: matchError } = await supabase
            .from("enhanced_matches")
            .insert({
              user1_id,
              user2_id,
              status: 'matched',
              user1_swiped: true,
              user2_swiped: true
            })
            .select()
            .single();

          if (matchError) {
            console.error("❌ Match creation error:", matchError);
            throw matchError;
          }

          console.log("✅ Match created:", match);

          // Create chat room
          const { data: chatRoom, error: chatError } = await supabase
            .from("chat_rooms")
            .insert({
              match_id: match.id,
              user1_id: match.user1_id,
              user2_id: match.user2_id
            })
            .select()
            .single();

          if (chatError) {
            console.error("❌ Chat room creation error:", chatError);
            throw chatError;
          }

          console.log("✅ Chat room created:", chatRoom);

          toast({
            title: "🎉 It's a Match!",
            description: `You and ${currentProfile.first_name} liked each other!`,
          });

          setMatchedChatId(chatRoom.id);
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
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Finding profiles for you...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">No more profiles!</h2>
        <p className="text-muted-foreground mb-6">You've seen everyone for now. Check back later for new profiles.</p>
        <Button onClick={fetchProfiles} className="bg-gradient-primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="max-w-md mx-auto space-y-4">
      <GhostBenchBar onChatSelected={setMatchedChatId} />
      
      {/* Filters Bar */}
      <div className="flex gap-2 p-2">
        <Button variant="outline" size="sm" className="rounded-full">
          <Filter className="w-4 h-4 mr-2" />
          Age ▼
        </Button>
        <Button variant="outline" size="sm" className="rounded-full">
          Height ▼
        </Button>
        <Button variant="outline" size="sm" className="rounded-full">
          Dating Intentions ▼
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="relative overflow-hidden h-[600px] shadow-xl">
        <div className="relative h-full">
          {/* Profile Image */}
          <div className="absolute inset-0">
            {currentProfile.profile_images && currentProfile.profile_images.length > 0 ? (
              <img
                src={currentProfile.profile_images[0]}
                alt={currentProfile.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-6xl mb-4">👤</div>
                  <p>No Photo</p>
                </div>
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>

          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <Button variant="ghost" size="icon" className="text-white bg-black/20 backdrop-blur-sm">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white bg-black/20 backdrop-blur-sm">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>

          {/* Profile Info */}
          <div className="absolute bottom-20 left-6 right-6 text-white z-10">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl font-bold">
                {currentProfile.first_name}
              </h2>
              {currentProfile.age <= 20 && (
                <Badge className="bg-purple-600 hover:bg-purple-700">
                  New here
                </Badge>
              )}
            </div>
            
            <p className="text-lg opacity-90 mb-4">
              she/her
            </p>

            <div 
              className="cursor-pointer"
              onClick={() => setShowDetailedProfile(true)}
            >
              <p className="text-lg mb-2">Together, we could</p>
              <p className="text-xl font-medium opacity-90">
                {currentProfile.bio || "explore new adventures together..."}
              </p>
            </div>
          </div>

          {/* Heart Button */}
          <Button
            onClick={() => setShowDetailedProfile(true)}
            size="icon"
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white hover:bg-gray-100 z-10"
          >
            <Heart className="w-6 h-6 text-gray-600" />
          </Button>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 pt-4">
        <Button
          onClick={() => handleSwipe('left')}
          size="icon"
          variant="outline"
          className="w-14 h-14 rounded-full border-2 hover:bg-red-50 hover:border-red-300"
        >
          <X className="w-6 h-6 text-red-500" />
        </Button>
        
        <Button
          onClick={() => handleSwipe('right')}
          size="icon"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
        >
          <Heart className="w-6 h-6" />
        </Button>
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