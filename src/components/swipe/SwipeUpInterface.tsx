import React, { useState, useEffect } from "react";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";
import SwipeUpDetailCard from "./SwipeUpDetailCard";
import ChatRequestModal from "@/components/notifications/ChatRequestModal";

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

interface SwipeUpInterfaceProps {
  onNavigate: (view: string) => void;
}

const SwipeUpInterface: React.FC<SwipeUpInterfaceProps> = ({ onNavigate }) => {
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showChatRequest, setShowChatRequest] = useState(false);
  
  const { toast } = useToast();
  const { userId, isLoading: authLoading } = useRequiredAuth();

  // Fetch profiles from backend
  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching profiles for userId:', userId);
      
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

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to fetch feed: ${response.status} ${errorText}`);
      }

      const payload = await response.json();
      console.log('📦 Raw payload:', payload);
      
      const profilesData = payload?.data?.profiles || payload?.profiles || [];
      console.log('👥 Profiles data:', profilesData);

      const formattedProfiles = profilesData.map((profile: any) => ({
        ...profile,
        age: profile.date_of_birth
          ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
          : 22,
        premium: profile.profile_images && profile.profile_images.length > 0,
      }));

      console.log('✨ Formatted profiles:', formattedProfiles);
      setProfiles(formattedProfiles);
      
      if (formattedProfiles.length > 0) {
        toast({
          title: "Premium Profiles Loaded! ✨",
          description: `Found ${formattedProfiles.length} exclusive matches`,
        });
      } else {
        console.warn('⚠️ No profiles found in response');
        toast({
          title: "No Profiles Found",
          description: "No matches available at the moment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Fetch profiles error:', error);
      toast({
        title: "Error",
        description: `Failed to load profiles: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔐 Auth status - userId:', userId, 'authLoading:', authLoading);
    if (userId && !authLoading) {
      console.log('✅ User authenticated, fetching profiles...');
      fetchProfiles();
    } else if (!authLoading && !userId) {
      console.warn('⚠️ No authenticated user found');
    }
  }, [userId, authLoading]);

  // Handle swipe action
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
          title: "It's a Match! 🎉💕",
          description: `You and ${currentProfile.first_name} liked each other!`,
          duration: 5000,
        });
      } else if (direction === "right") {
        toast({ 
          title: "Like sent! 💖", 
          description: "We'll notify you if they like you back." 
        });
      }

      // Move to next profile
      setCurrentIndex((prev) => prev + 1);
      
    } catch (error) {
      console.error('Swipe error:', error);
      toast({
        title: "Error",
        description: "Failed to process swipe. Please try again.",
        variant: "destructive",
      });
      // Still move to next profile even if there's an error
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleChatRequest = () => {
    setShowChatRequest(true);
  };

  // Auth Loading
  if (authLoading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-6 text-pink-400" />
          <p className="text-white/70 text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Loading profiles
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/70 text-lg">Finding premium matches...</p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  // No profiles left
  if (currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-md">
          <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <span className="text-6xl">💕</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">No More Profiles!</h2>
            <p className="text-white/70 text-lg">
              You've explored all premium profiles. New exclusive matches are added daily!
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={fetchProfiles} 
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-8 py-3 text-lg font-semibold rounded-full shadow-xl"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Discover More
            </Button>
            <Button 
              onClick={() => onNavigate('home')} 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0iIzk5OTk5OSIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-20"></div>
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('home')}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-white font-bold text-lg">Discover</h1>
            <p className="text-white/60 text-sm">{currentIndex + 1} of {profiles.length}</p>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={fetchProfiles}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <RefreshCw className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 flex items-center justify-center min-h-screen">
        <SwipeUpDetailCard
          profile={currentProfile}
          onSwipe={handleSwipe}
          onChatRequest={handleChatRequest}
        />
      </div>

      {/* Chat Request Modal */}
      {currentProfile && (
        <ChatRequestModal
          isOpen={showChatRequest}
          onClose={() => setShowChatRequest(false)}
          profile={{
            user_id: currentProfile.user_id,
            first_name: currentProfile.first_name,
            last_name: currentProfile.last_name,
            profile_images: currentProfile.profile_images,
            university: currentProfile.university,
            bio: currentProfile.bio
          }}
        />
      )}
    </div>
  );
};

export default SwipeUpInterface;