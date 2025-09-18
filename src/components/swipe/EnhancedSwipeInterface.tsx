import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, RefreshCw, Settings, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
import DetailedProfileModal from "@/components/profile/DetailedProfileModal";
import RebuiltChatSystem from "@/components/chat/RebuiltChatSystem";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";
import LocationFinder from "@/components/LocationFinder";

interface SwipeProfile {
  user_id: string;
  firebase_uid?: string;
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
  distance?: number;
  weight?: number;
  premium?: boolean;
}

interface EnhancedSwipeInterfaceProps {
  onNavigate: (view: string) => void;
}

const SWIPE_THRESHOLD = 100;

const EnhancedSwipeInterface: React.FC<EnhancedSwipeInterfaceProps> = ({ onNavigate }) => {
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [matchedChatId, setMatchedChatId] = useState<string>("");

  const { toast } = useToast();
  const { userId, isLoading: authLoading } = useRequiredAuth();

  // Drag state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);

  // Only show LocationFinder if user is logged in
  const showLocation = !!userId;

  // Fetch profiles
  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithFirebaseAuth(
        "https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/data-management",
        {
          method: "POST",
          body: JSON.stringify({
            action: "get_feed",
            user_id: userId,
            limit: 20,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }

      const payload = await response.json();
      const profilesData = payload?.data?.profiles || [];

      const formattedProfiles = profilesData.map((profile: any) => ({
        ...profile,
        age: profile.date_of_birth
          ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
          : 22,
        premium: profile.profile_images && profile.profile_images.length > 0,
      }));

      setProfiles(formattedProfiles);
      if (formattedProfiles.length > 0) {
        toast({
          title: "Profiles Loaded!",
          description: `Found ${formattedProfiles.length} profiles to explore`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchProfiles();
  }, [userId]);

  // Handle swipe action - sends like/pass to backend and updates UI
  const handleSwipe = async (direction: "left" | "right") => {
    if (currentIndex >= profiles.length) return;
    const currentProfile = profiles[currentIndex];

    try {
      const response = await fetchWithFirebaseAuth(
        "https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/enhanced-swipe-action",
        {
          method: "POST",
          body: JSON.stringify({
            target_user_id: currentProfile.firebase_uid || currentProfile.user_id,
            direction,
          }),
        }
      );

      if (!response.ok) throw new Error("Swipe failed");

      const resp = await response.json();

      if (resp?.matched) {
        toast({
          title: "It's a Match! 🎉",
          description: `You and ${currentProfile.first_name} liked each other!`,
          duration: 5000,
        });
        if (resp?.chatRoomId) {
          setTimeout(() => setMatchedChatId(resp.chatRoomId), 2000);
        }
      } else if (direction === "right") {
        toast({ title: "Like sent! 💖", description: "We'll notify you if they like you back." });
      } else {
        toast({ title: "Passed", description: `You passed on ${currentProfile.first_name}` });
      }

      setCurrentIndex((prev) => prev + 1);
      setCurrentImageIndex(0);
    } catch {
      toast({
        title: "Error",
        description: "Failed to process swipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Auth Loading
  if (authLoading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-6 text-pink-500" />
          <p className="text-white/70 text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Chat view if matched
  if (matchedChatId) {
    return (
      <div className="space-y-4 min-h-screen bg-gradient-to-br from-black to-gray-900 p-4">
        <Button variant="outline" onClick={() => setMatchedChatId("")} className="mb-4">
          ← Back to Swiping
        </Button>
        <RebuiltChatSystem onNavigate={onNavigate} selectedChatId={matchedChatId} />
      </div>
    );
  }

  // Loading profiles
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-6 text-pink-500" />
          <p className="text-white/70 text-lg">Finding your perfect matches...</p>
        </div>
      </div>
    );
  }

  // No profiles left
  if (currentIndex >= profiles.length) {
    return (
      <div className="text-center py-20 min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
        <div className="max-w-md mx-auto space-y-8">
          <div className="w-32 h-32 bg-gradient-pink rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gradient-pink">No More Profiles!</h2>
          <p className="text-white/70 text-lg">New matches are added daily. Check back soon!</p>
          <Button onClick={fetchProfiles} className="bg-gradient-pink px-8 py-3 text-lg">
            <RefreshCw className="w-5 h-5 mr-2" />
            Discover More
          </Button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  const [showAbout, setShowAbout] = React.useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 50) {
      setShowAbout(true);
    } else {
      setShowAbout(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex flex-col items-center justify-start p-4 overflow-y-auto"
      onScroll={handleScroll}
      style={{ maxHeight: '100vh' }}
    >
      {/* Location Finder */}
      {showLocation && <LocationFinder />}

      {/* Card */}
      <Card
        className="relative overflow-hidden shadow-lg rounded-3xl w-full max-w-md"
        style={{
          height: "60vh",
          transform: `translateX(${dragX}px) rotate(${dragX / 15}deg)`,
          transition: isDragging ? "none" : "transform 0.3s ease-in-out",
        }}
        onTouchStart={(e) => {
          dragStartX.current = e.touches[0].clientX;
          setIsDragging(true);
        }}
        onTouchMove={(e) => {
          if (!isDragging || dragStartX.current === null) return;
          const deltaX = e.touches[0].clientX - dragStartX.current;
          setDragX(deltaX);
        }}
        onTouchEnd={() => {
          setIsDragging(false);
          if (dragX > SWIPE_THRESHOLD) handleSwipe("right");
          else if (dragX < -SWIPE_THRESHOLD) handleSwipe("left");
          setDragX(0);
          dragStartX.current = null;
        }}
        onMouseDown={(e) => {
          dragStartX.current = e.clientX;
          setIsDragging(true);
        }}
        onMouseMove={(e) => {
          if (!isDragging || dragStartX.current === null) return;
          const deltaX = e.clientX - dragStartX.current;
          setDragX(deltaX);
        }}
        onMouseUp={() => {
          setIsDragging(false);
          if (dragX > SWIPE_THRESHOLD) handleSwipe("right");
          else if (dragX < -SWIPE_THRESHOLD) handleSwipe("left");
          setDragX(0);
          dragStartX.current = null;
        }}
      >
        {/* Image */}
        {currentProfile.profile_images?.length > 0 ? (
          <>
            <img
              src={currentProfile.profile_images[currentImageIndex]}
              alt={`${currentProfile.first_name}'s profile`}
              className="w-full h-full object-cover rounded-3xl"
            />
            {/* Image Navigation */}
            {currentProfile.profile_images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : currentProfile.profile_images.length - 1));
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev < currentProfile.profile_images.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  aria-label="Next image"
                >
                  ›
                </button>
                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {currentProfile.profile_images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-pink rounded-3xl">
            <p className="text-white">Premium Profile</p>
          </div>
        )}
      </Card>

      {/* Basic Info Overlay */}
      <div className="w-full max-w-md bg-black bg-opacity-70 rounded-b-3xl p-4 mt-[-4rem] relative z-10 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">{currentProfile.first_name} {currentProfile.last_name}, {currentProfile.age}</h2>
            <div className="flex items-center space-x-2 text-sm opacity-80">
              <span>⭐ PREMIUM</span>
              <span>•</span>
              <span>{currentProfile.university || 'Unknown Location'}</span>
            </div>
          </div>
          <button className="text-pink-500 hover:text-pink-400" aria-label="Like" onClick={() => handleSwipe("right")}>
            <Heart className="w-8 h-8" />
          </button>
        </div>
        <div className="mt-2 flex space-x-4 text-xs opacity-80">
          <div className="flex items-center space-x-1">
            <span>{currentProfile.distance ? `${currentProfile.distance} km` : "N/A"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>{currentProfile.weight ? `${currentProfile.weight} Kg` : "N/A"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>{currentProfile.height ? `${currentProfile.height} cm` : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* About Section - shown on scroll */}
      {showAbout && (
        <Card className="w-full max-w-md mt-6 p-4 bg-black bg-opacity-80 text-white rounded-3xl">
          <h3 className="text-xl font-semibold mb-2">About {currentProfile.first_name}</h3>
          <p>{currentProfile.bio || "No additional information provided."}</p>
          <div className="mt-4 space-y-1 text-sm opacity-80">
            <div><strong>Interests:</strong> {currentProfile.interests.join(", ")}</div>
            <div><strong>Relationship Goals:</strong> {currentProfile.relationship_goals.join(", ")}</div>
            <div><strong>Height:</strong> {currentProfile.height} cm</div>
            <div><strong>Personality Type:</strong> {currentProfile.personality_type}</div>
            <div><strong>Values:</strong> {currentProfile.values}</div>
            <div><strong>Mindset:</strong> {currentProfile.mindset}</div>
            <div><strong>University:</strong> {currentProfile.university}</div>
            <div><strong>Year of Study:</strong> {currentProfile.year_of_study}</div>
            <div><strong>Major:</strong> {currentProfile.major}</div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-8 pt-6">
        <Button onClick={() => handleSwipe("left")} size="icon" variant="outline">
          <X className="w-8 h-8 text-red-600" />
        </Button>
        <Button onClick={() => setShowDetailedProfile(true)} size="icon" variant="outline">
          <MoreHorizontal className="w-8 h-8 text-gray-400" />
        </Button>
        <Button onClick={() => handleSwipe("right")} size="icon" className="bg-gradient-pink">
          <Heart className="w-8 h-8 text-white" />
        </Button>
      </div>

      {/* Modal */}
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
