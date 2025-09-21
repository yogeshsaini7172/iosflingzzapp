import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  X, 
  MessageCircle, 
  Star, 
  MapPin, 
  GraduationCap,
  User,
  Weight,
  Ruler,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface SwipeUpDetailCardProps {
  profile: SwipeProfile;
  onSwipe: (direction: "left" | "right") => void;
  onChatRequest: () => void;
}

const SwipeUpDetailCard: React.FC<SwipeUpDetailCardProps> = ({ 
  profile, 
  onSwipe, 
  onChatRequest 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [detailPanelOffset, setDetailPanelOffset] = useState(0);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startPanelOffset = useRef<number>(0);
  
  const { toast } = useToast();

  // Panel dimensions
  const PANEL_HEIGHT = 400;
  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startPanelOffset.current = detailPanelOffset;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = startY.current - currentY; // Positive when swiping up
    const newOffset = Math.max(0, Math.min(PANEL_HEIGHT, startPanelOffset.current + deltaY));
    
    setDetailPanelOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Snap to positions based on offset
    if (detailPanelOffset > SWIPE_THRESHOLD) {
      setDetailPanelOffset(PANEL_HEIGHT);
      setIsDetailExpanded(true);
      toast({
        title: "Profile Details",
        description: `Viewing ${profile.first_name}'s detailed profile`,
      });
    } else {
      setDetailPanelOffset(0);
      setIsDetailExpanded(false);
    }
  };

  const toggleDetailPanel = () => {
    if (isDetailExpanded) {
      setDetailPanelOffset(0);
      setIsDetailExpanded(false);
    } else {
      setDetailPanelOffset(PANEL_HEIGHT);
      setIsDetailExpanded(true);
    }
  };

  const nextImage = () => {
    if (profile.profile_images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev < profile.profile_images.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevImage = () => {
    if (profile.profile_images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev > 0 ? prev - 1 : profile.profile_images.length - 1
      );
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-[70vh] overflow-hidden">
      {/* Main Profile Card */}
      <Card
        ref={cardRef}
        className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-0 swipe-card floating-card ${
          isDragging ? '' : 'transition-transform duration-300'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Profile Image Container */}
        <div className="relative w-full h-full">
          {profile.profile_images?.length > 0 ? (
            <>
              <img
                src={profile.profile_images[currentImageIndex]}
                alt={`${profile.first_name}'s profile`}
                className="w-full h-full object-cover"
              />
              
              {/* Image Navigation */}
              {profile.profile_images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
                  >
                    ›
                  </button>
                  
                  {/* Image Dots */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {profile.profile_images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <div className="text-center text-white">
                <User className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Premium Profile</p>
              </div>
            </div>
          )}

          {/* Premium Badge */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-yellow-500 text-black font-semibold px-3 py-1 rounded-full">
              ⭐ PREMIUM
            </Badge>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Basic Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">
                  {profile.first_name} {profile.age} 💖
                </h2>
                <div className="flex items-center space-x-2 text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.university}</span>
                </div>
                
                {/* Quick Stats */}
                <div className="flex space-x-4 text-xs">
                  <Badge variant="secondary" className="bg-pink-500/20 text-pink-200 border-pink-300">
                    📍 {profile.distance || 2.5}km
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-300">
                    ⚖️ {profile.weight || 55}Kg
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-300">
                    📏 {profile.height}cm
                  </Badge>
                </div>
              </div>
            </div>

            {/* Swipe Up Indicator */}
            <div className="flex justify-center mt-4">
              <button
                onClick={toggleDetailPanel}
                className="bg-white/20 backdrop-blur-sm rounded-full p-2 swipe-indicator pulse-glow"
              >
                {isDetailExpanded ? (
                  <ChevronDown className="w-6 h-6 text-white" />
                ) : (
                  <ChevronUp className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Panel - Slides up from bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-black/95 detail-panel rounded-t-3xl border-t border-white/20 ${
          isDragging ? 'detail-panel-dragging' : ''
        }`}
        style={{
          transform: `translateY(${PANEL_HEIGHT - detailPanelOffset}px)`,
          height: `${PANEL_HEIGHT}px`,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Detail Content */}
        <div className="px-6 pb-6 text-white overflow-y-auto max-h-80">
          {/* About Section */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-gradient-primary">About</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              {profile.bio || "Hi! When a user passes on a match, the conversation would close for both users and neither can message anymore 😊"}
            </p>
            <p className="text-white/80 text-sm leading-relaxed mt-2">
              Finally hereafter losing all the hopes of finding the right all. I love Netflix, horses and books!
            </p>
          </div>

          {/* More Info Section */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">More info</h3>
            <div className="grid grid-cols-2 gap-2">
              <Badge className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 flex items-center space-x-2 px-3 py-2">
                <User className="w-4 h-4" />
                <span>{profile.gender === 'female' ? 'Women' : 'Men'}</span>
              </Badge>
              <Badge className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 flex items-center space-x-2 px-3 py-2">
                <GraduationCap className="w-4 h-4" />
                <span>{profile.major || 'Student'}</span>
              </Badge>
              <Badge className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 flex items-center space-x-2 px-3 py-2">
                <span>🎭</span>
                <span>{profile.personality_type || 'Creative'}</span>
              </Badge>
              <Badge className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 flex items-center space-x-2 px-3 py-2">
                <span>❤️</span>
                <span>I like it!</span>
              </Badge>
              {profile.interests.slice(0, 2).map((interest, index) => (
                <Badge key={index} className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 px-3 py-2">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Archive Section */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Archive</h3>
            <div className="grid grid-cols-2 gap-2">
              {profile.profile_images.slice(1, 3).map((image, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={image} 
                    alt={`Archive ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
        <Button
          onClick={onChatRequest}
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </Button>
        
        <Button
          onClick={() => onSwipe('left')}
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-red-500/20 transition-all"
        >
          <X className="w-7 h-7 text-white" />
        </Button>
        
        <Button
          onClick={() => onSwipe('right')}
          size="lg"
          className="w-16 h-16 rounded-full bg-pink-500 hover:bg-pink-600 transition-all shadow-lg"
        >
          <Heart className="w-7 h-7 text-white" fill="currentColor" />
        </Button>
      </div>

      {/* Swipe Instructions */}
      {!isDetailExpanded && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-white/60 text-xs">
          <p className="mb-1">Swipe up to see more details</p>
          <ChevronUp className="w-4 h-4 mx-auto animate-bounce" />
        </div>
      )}
    </div>
  );
};

export default SwipeUpDetailCard;