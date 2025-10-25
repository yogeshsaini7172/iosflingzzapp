import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import {
  Heart,
  HeartCrack,
  X,
  Users,
  Sparkles,
  User,
  Star,
  Send,
  MessageCircle,
  Plus,
  Flame,  // replaced by branded logo
  Zap,
  MoreVertical,
  Edit,
  Trash2,
  Brain,
  Activity
} from "lucide-react";
import { fetchProfilesFeed } from '@/services/profile';
import Loader from '@/components/ui/Loader';
import { useToast } from '@/hooks/use-toast';
import ChatNotificationBadge from '@/components/ui/chat-notification-badge';
import HeartNotificationBadge from '@/components/ui/heart-notification-badge';
import WhoLikedMeModal from '@/components/likes/WhoLikedMeModal';
import { useSwipeRealtime, useLikeRealtime, useNotificationRealtime } from '@/hooks/useRealtime';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { calculateCompatibility, type CompatibilityScore } from '@/services/compatibility';
import { getCurrentLocation, calculateDistance, type LocationData } from '@/utils/locationUtils';
import { CompatibilityGroup, CompatibilityBadge } from '@/components/swipe/CompatibilityBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileData } from '@/hooks/useProfileData';
import { useNavigate } from 'react-router-dom';


interface FlingzzHomeProps {
  onNavigate: (view: string) => void;
}

const FlingzzHome = ({ onNavigate }: FlingzzHomeProps) => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showWhoLikedMe, setShowWhoLikedMe] = useState(false);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchCurrentX, setTouchCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [compatibility, setCompatibility] = useState<CompatibilityScore | null>(null);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [autoSlideInterval, setAutoSlideInterval] = useState<NodeJS.Timeout | null>(null);
  const [isSwipeProcessing, setIsSwipeProcessing] = useState(false);
  
  // Slider button state
  const [sliderDragX, setSliderDragX] = useState(0);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [sliderStartX, setSliderStartX] = useState(0);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile: userProfile } = useProfileData();
  const [communityJoined, setCommunityJoined] = useState<boolean>(() => {
    try {
      return localStorage.getItem('flingzz_community_joined') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Set up realtime listeners
  const userId = user?.uid;
  
  if (userId) {
    useSwipeRealtime(userId, (match) => {
      toast({
        title: "New Match! 🔥",
        description: "You have a new mutual match!",
      });
    });

    useLikeRealtime(userId, (like) => {
      toast({
        title: "Someone liked you! ❤️",
        description: "Check your likes to see who it is!",
      });
    });

    useNotificationRealtime(userId, (notification) => {
      toast({
        title: notification.title,
        description: notification.message,
      });
    });
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    // Prevent duplicate swipes
    if (isSwipeProcessing) {
      console.log('⚠️ Swipe already in progress, ignoring duplicate request');
      return;
    }

    if (currentIndex >= profiles.length || !user?.uid) return;

    const currentProfile = profiles[currentIndex];
    
    // Set processing flag to prevent duplicates
    setIsSwipeProcessing(true);

    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/enhanced-swipe-action', {
        method: 'POST',
        body: JSON.stringify({
          target_user_id: currentProfile.user_id,
          direction,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle duplicate swipe error gracefully
        if (errorData.error?.includes('Duplicate swipe')) {
          console.log('ℹ️ Duplicate swipe detected, moving to next profile');
          setCurrentIndex(prev => prev + 1);
          setCurrentImageIndex(0);
          setSwipeOffset(0);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to process swipe');
      }

      const data = await response.json();

      if (data?.matched) {
        toast({
          title: "It's a Match! 🔥",
          description: `You and ${currentProfile.first_name} liked each other!`,
        });
      } else if (direction === 'right') {
        toast({
          title: 'Like sent! 💖',
          description: "We'll let you know if they like you back.",
        });
      }

      setCurrentIndex(prev => prev + 1);
      setCurrentImageIndex(0);
      setSwipeOffset(0);

    } catch (error) {
      console.error('Error handling swipe:', error);
      setCurrentIndex(prev => prev + 1);
      setCurrentImageIndex(0);
      setSwipeOffset(0);
    } finally {
      // Always release the processing flag after a short delay
      setTimeout(() => {
        setIsSwipeProcessing(false);
      }, 300);
    }
  };


  const currentProfile = profiles[currentIndex];

  const distance = userLocation && currentProfile?.latitude && currentProfile?.longitude
    ? calculateDistance(userLocation.latitude, userLocation.longitude, currentProfile.latitude, currentProfile.longitude)
    : null;

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentIndex]);

  // Fetch user location on mount
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('Error fetching user location:', error);
        setUserLocation(null);
      }
    };
    fetchUserLocation();
  }, []);

  // Keyboard navigation for desktop (Arrow keys)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only activate on desktop (not mobile)
      if (window.innerWidth < 768) return;
      
      // Prevent if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isSwipeProcessing) handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!isSwipeProcessing) handleSwipe('right');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, profiles]); // Re-bind when profile changes

  // Fetch profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await fetchProfilesFeed();
        if (response.profiles) {
          setProfiles(response.profiles);
        } else {
          setProfiles([]);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []);

  // Compute compatibility when current profile changes
  useEffect(() => {
    if (currentProfile && user?.uid && currentProfile.user_id) {
      const computeCompatibility = async () => {
        // Validate we have both user IDs before attempting calculation
        if (!user?.uid || !currentProfile?.user_id) {
          setCompatibility(null);
          setCompatibilityLoading(false);
          return;
        }

        setCompatibilityLoading(true);
        try {
          const result = await calculateCompatibility(user.uid, currentProfile.user_id);
          if (result) {
            // Defensive check for NaN or undefined scores
            const overall = isNaN(result.overall_score) ? 63 : result.overall_score;
            const physical = isNaN(result.physical_score) ? 50 : result.physical_score;
            const mental = isNaN(result.mental_score) ? 75 : result.mental_score;
            setCompatibility({
              ...result,
              overall_score: overall,
              physical_score: physical,
              mental_score: mental,
            });
          } else {
            // Set fallback scores instead of null
            setCompatibility({
              physical_score: 50,
              mental_score: 75,
              overall_score: 63,
              shared_interests: [],
              compatibility_reasons: []
            });
          }
        } catch (error) {
          console.error('❌ Error calculating compatibility:', error);
          // Set fallback scores on error
          setCompatibility({
            physical_score: 50,
            mental_score: 75,
            overall_score: 63,
            shared_interests: [],
            compatibility_reasons: []
          });
        } finally {
          setCompatibilityLoading(false);
        }
      };
      
      // Small delay to ensure profile data is loaded
      const timeoutId = setTimeout(() => {
        computeCompatibility();
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      setCompatibility(null);
      setCompatibilityLoading(false);
    }
  }, [currentProfile, user?.uid]);

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!currentProfile?.profile_images || currentProfile.profile_images.length <= 1) return;
    
    // Clear auto-slide interval when manually navigating
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      setAutoSlideInterval(null);
    }
    
    const totalImages = currentProfile.profile_images.length;
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
    
    // Restart auto-slide after manual navigation
    startAutoSlide();
  };

  // Auto-slide functionality for multiple images
  const startAutoSlide = () => {
    if (!currentProfile || !currentProfile.profile_images || currentProfile.profile_images.length <= 1) {
      return;
    }

    // Clear any existing interval
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
    }

    // Start new auto-slide with 3.5 second interval
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        if (!currentProfile || !currentProfile.profile_images) return 0;
        const totalImages = currentProfile.profile_images.length;
        return (prev + 1) % totalImages;
      });
    }, 3500); // 3.5 seconds

    setAutoSlideInterval(interval);
  };

  // Start auto-slide when profile changes
  useEffect(() => {
    if (currentProfile && currentProfile.profile_images && currentProfile.profile_images.length > 1) {
      setCurrentImageIndex(0); // Reset to first image
      startAutoSlide();
    }

    // Cleanup on unmount or profile change
    return () => {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        setAutoSlideInterval(null);
      }
    };
  }, [currentProfile?.id]);

  // Pause auto-slide when swiping
  useEffect(() => {
    if (isSwiping && autoSlideInterval) {
      clearInterval(autoSlideInterval);
      setAutoSlideInterval(null);
    } else if (!isSwiping && currentProfile && currentProfile.profile_images && currentProfile.profile_images.length > 1) {
      startAutoSlide();
    }
  }, [isSwiping]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchCurrentX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    setTouchCurrentX(currentX);
    const deltaX = currentX - touchStartX;
    setSwipeOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    // Prevent duplicate swipes
    if (isSwipeProcessing) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }
    
    const deltaX = touchCurrentX - touchStartX;
    const threshold = 100; // Threshold for swipe action
    const velocity = Math.abs(deltaX);
    
    if (Math.abs(deltaX) > threshold) {
      // Animate card flying off screen with velocity-based speed
      const direction = deltaX > 0 ? 1 : -1;
      const exitDistance = window.innerWidth + 200;
      setSwipeOffset(direction * exitDistance);
      
      // Faster animation for quick swipes
      const animationDuration = velocity > 200 ? 200 : 300;
      
      setTimeout(() => {
        if (deltaX > 0) {
          handleSwipe('right');
        } else {
          handleSwipe('left');
        }
        // Reset immediately after swipe completes
        setSwipeOffset(0);
      }, animationDuration);
    } else {
      // Spring back animation with elastic easing
      setSwipeOffset(0);
    }
    
    setIsSwiping(false);
    setTouchStartX(0);
    setTouchCurrentX(0);
  };

  // Slider button handlers
  const handleSliderStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingSlider(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setSliderStartX(clientX);
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingSlider) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - sliderStartX;
    
    // Constrain to slider width (approximately 280px, so -140 to +140)
    const maxDistance = 140;
    const constrainedX = Math.max(-maxDistance, Math.min(maxDistance, deltaX));
    setSliderDragX(constrainedX);
  };

  const handleSliderEnd = () => {
    if (!isDraggingSlider) return;
    
    // Prevent duplicate swipes
    if (isSwipeProcessing) {
      setSliderDragX(0);
      setIsDraggingSlider(false);
      setSliderStartX(0);
      return;
    }
    
    const threshold = 100; // Distance needed to trigger action
    
    if (sliderDragX > threshold) {
      // Liked - Hold animation for 0.45s before executing
      setTimeout(() => {
        handleSwipe('right');
        setSliderDragX(0);
        setIsDraggingSlider(false);
        setSliderStartX(0);
      }, 450);
    } else if (sliderDragX < -threshold) {
      // Passed - Hold animation for 0.45s before executing
      setTimeout(() => {
        handleSwipe('left');
        setSliderDragX(0);
        setIsDraggingSlider(false);
        setSliderStartX(0);
      }, 450);
    } else {
      // Reset slider if threshold not met
      setSliderDragX(0);
      setIsDraggingSlider(false);
      setSliderStartX(0);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSwipeIndicatorColor = () => {
    if (swipeOffset > 50) return 'text-green-500';
    if (swipeOffset < -50) return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <UnifiedLayout title="FLINGZZ" showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader size={96} text="Finding matches..." />
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout title="FLINGZZ" showHeader={false}>
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-xl border-b border-border/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 w-8"
              />
              <p className="text-xs text-muted-foreground">Discover • Connect • Match</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <HeartNotificationBadge onClick={() => setShowWhoLikedMe(true)} />
            <ChatNotificationBadge onClick={() => onNavigate('chat')} />
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm px-6 py-4 border-b border-border/10">
        <div className="max-w-md mx-auto text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Join FLINGZZ Community</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Get exclusive updates, offers, campaigns by FLINGZZ & professional consulting
          </p>
          <Button 
            onClick={() => {
              try {
                localStorage.setItem('flingzz_community_joined', 'true');
              } catch (e) {
                // ignore
              }
              setCommunityJoined(true);
              onNavigate('community');
            }}
            className="w-full max-w-xs bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
            aria-pressed={communityJoined}
          >
            {communityJoined ? 'Explore Community' : 'Join Now'}
          </Button>
        </div>
      </div>

      {/* Main Swipe Section */}
      <div className="flex-1 flex items-center justify-center px-2 pb-2">
        {currentProfile ? (
          <div className="w-[90%] max-w-[340px] md:max-w-md flex flex-col">
            {/* Card Stack Container */}
            <div className="relative h-[calc(100vh-280px)] md:h-[calc(100vh-200px)]">
            {/* Next Card Preview (Behind) */}
            {profiles[currentIndex + 1] ? (
              <div 
                className="absolute inset-0 bg-card rounded-3xl overflow-hidden shadow-xl transition-all duration-300"
              style={{
                  transform: Math.abs(swipeOffset) > 50 
                    ? `scale(${0.95 + (Math.abs(swipeOffset) / 2000)}) translateY(${10 - (Math.abs(swipeOffset) / 20)}px)` 
                    : 'scale(0.95) translateY(10px)',
                  zIndex: 0,
                  opacity: Math.abs(swipeOffset) > 50 
                    ? 0.5 + (Math.abs(swipeOffset) / 500) 
                    : 0.5
                }}
              >
                <img
                  src={profiles[currentIndex + 1].profile_images?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face'}
                  alt="Next profile"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div 
                className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/20 dark:from-gray-800/20 dark:via-gray-900/10 dark:to-gray-800/20 border-2 border-white/30 dark:border-gray-700/30 transition-all duration-300"
                style={{
                  transform: Math.abs(swipeOffset) > 50 
                    ? `scale(${0.95 + (Math.abs(swipeOffset) / 2000)}) translateY(${10 - (Math.abs(swipeOffset) / 20)}px)` 
                    : 'scale(0.95) translateY(10px)',
                  zIndex: 0,
                  opacity: Math.abs(swipeOffset) > 50 
                    ? 0.5 + (Math.abs(swipeOffset) / 500) 
                    : 0.5
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-700/30 dark:to-gray-800/10 backdrop-blur-md flex items-center justify-center border-2 border-white/40 dark:border-gray-600/40">
                      <Heart className="w-12 h-12 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-semibold text-lg">No more profiles</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Check back later!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Swipe Card */}
            <div 
              className="absolute inset-0 bg-card rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing will-change-transform"
              style={{
                transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.02}deg) scale(${1 - Math.abs(swipeOffset) / 4000})`,
                transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.3), 0 0 40px -10px rgba(var(--primary), 0.2)',
                opacity: Math.abs(swipeOffset) > 50 
                  ? Math.max(1 - Math.abs(swipeOffset) / 500, 0.3)
                  : 1,
                zIndex: 10
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={(e) => {
                setTouchStartX(e.clientX);
                setTouchCurrentX(e.clientX);
                setIsSwiping(true);
              }}
              onMouseMove={(e) => {
                if (!isSwiping) return;
                const currentX = e.clientX;
                setTouchCurrentX(currentX);
                const deltaX = currentX - touchStartX;
                setSwipeOffset(deltaX);
              }}
              onMouseUp={handleTouchEnd}
              onMouseLeave={() => {
                if (isSwiping) {
                  handleTouchEnd();
                }
              }}
            >
              {/* Premium Badge with Glow */}
              <div className="absolute top-4 right-4 z-10 animate-fade-in">
                <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>PREMIUM</span>
                </div>
              </div>

              {/* Image Progress Dots */}
              {currentProfile.profile_images?.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10 animate-fade-in">
                  {currentProfile.profile_images.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'bg-white w-8 shadow-lg' 
                          : 'bg-white/40 w-1'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Full Height Image */}
              <div className="relative h-full">
                <img
                  src={currentProfile.profile_images?.[currentImageIndex] || currentProfile.profile_images?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face'}
                  alt={currentProfile.first_name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => {
                    setPhotoViewerIndex(currentImageIndex);
                    setShowPhotoViewer(true);
                  }}
                />
                
                {/* Image Navigation Arrows - for multiple images */}
                {currentProfile.profile_images?.length > 1 && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-3 pointer-events-none">
                    <button
                      onClick={() => handleImageNavigation('prev')}
                      className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 pointer-events-auto"
                    >
                      <span className="text-white text-xl font-bold">‹</span>
                    </button>
                    <button
                      onClick={() => handleImageNavigation('next')}
                      className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 pointer-events-auto"
                    >
                      <span className="text-white text-xl font-bold">›</span>
                    </button>
                  </div>
                )}


                {/* Enhanced Profile Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 pb-6">
                  <div className="text-white space-y-2.5">
                    {/* Name & Age */}
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-1 flex items-center space-x-2 drop-shadow-lg">
                        <span>{currentProfile.first_name}</span>
                        <span className="text-xl md:text-2xl font-medium opacity-90">{calculateAge(currentProfile.date_of_birth)}</span>
                      </h3>
                      <p className="text-xs md:text-sm opacity-90 flex items-center space-x-1.5">
                        <span>📍</span>
                        <span>{currentProfile.university || 'University'}</span>
                        {currentProfile.total_qcs && (
                          <>
                            <span className="text-white/40">•</span>
                            <span className="text-pink-400 font-bold">QCS {currentProfile.total_qcs}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Quick Stats Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {distance !== null && (
                        <div className="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/20">
                          📍 {distance.toFixed(1)}km
                        </div>
                      )}
                      {currentProfile.height && (
                        <div className="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/20">
                          📏 {currentProfile.height}cm
                        </div>
                      )}
                      {currentProfile.profession && (
                        <div className="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/20 max-w-[120px] truncate">
                          🎓 {currentProfile.profession}
                        </div>
                      )}
                    </div>

                    {/* Compatibility Scores */}
                    {compatibility && !compatibilityLoading && (
                      <div className="grid grid-cols-3 gap-2 py-1.5">
                        <div className="text-center">
                          <div className="text-base md:text-lg font-bold text-purple-300">{compatibility.overall_score}%</div>
                          <div className="text-[9px] md:text-[10px] text-white/70">Overall</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base md:text-lg font-bold text-green-300">{compatibility.physical_score}%</div>
                          <div className="text-[9px] md:text-[10px] text-white/70">Physical</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base md:text-lg font-bold text-blue-300">{compatibility.mental_score}%</div>
                          <div className="text-[9px] md:text-[10px] text-white/70">Mental</div>
                        </div>
                      </div>
                    )}

                    {/* Interests */}
                    {currentProfile.interests && currentProfile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {currentProfile.interests.slice(0, 2).map((interest, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-white/15 backdrop-blur-md text-white text-[10px] rounded-full border border-white/20"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* View Full Profile Button */}
                    <button 
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-br from-white/20 via-white/10 to-white/20 hover:from-white/30 hover:via-white/20 hover:to-white/30 backdrop-blur-xl text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 border-white/30 hover:border-white/50 active:scale-95 hover:shadow-2xl mt-2"
                      onClick={() => setShowDetailedProfile(true)}
                    >
                      <Zap className="w-5 h-5" />
                      <span>View Full Profile</span>
                      <span className="text-lg">↑</span>
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons at Bottom - Desktop Only */}
            <div className="mt-4 hidden md:flex items-center justify-center gap-8">
              {/* Pass Button */}
              <button
                onClick={() => {
                  if (isSwipeProcessing) return;
                  setSwipeOffset(-(window.innerWidth + 200));
                  setTimeout(() => {
                    handleSwipe('left');
                    setSwipeOffset(0);
                  }, 300);
                }}
                disabled={isSwipeProcessing}
                className={`relative w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 group ${isSwipeProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <X className="w-7 h-7 text-red-500 group-hover:text-red-600 transition-all duration-200 group-hover:rotate-90" strokeWidth={2.5} />
                <div className="absolute inset-0 rounded-full bg-red-500/0 group-hover:bg-red-500/10 transition-all duration-200" />
              </button>

              {/* Like Button */}
              <button
                onClick={() => {
                  if (isSwipeProcessing) return;
                  setSwipeOffset(window.innerWidth + 200);
                  setTimeout(() => {
                    handleSwipe('right');
                    setSwipeOffset(0);
                  }, 300);
                }}
                disabled={isSwipeProcessing}
                className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-pink-400 group ${isSwipeProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className="w-9 h-9 text-white fill-white drop-shadow-lg transition-all duration-200 group-hover:scale-110" strokeWidth={2} />
                <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/20 transition-all duration-200" />
              </button>
            </div>

            {/* Slider Interface - Mobile Only */}
            <div 
              className="mt-4 md:hidden relative"
              onMouseMove={handleSliderMove}
              onMouseUp={handleSliderEnd}
              onTouchMove={handleSliderMove}
              onTouchEnd={handleSliderEnd}
            >
              {/* Slider Track */}
              <div className="relative w-full max-w-[320px] h-16 mx-auto bg-gradient-to-r from-gray-800/50 via-gray-700/50 to-gray-800/50 rounded-full backdrop-blur-md border border-white/10 overflow-hidden">
                
                {/* Background Hints */}
                <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
                  <div className={`flex items-center gap-2 transition-all duration-200 ${
                    sliderDragX < -30 ? 'opacity-100 scale-110' : 'opacity-40'
                  }`}>
                    <HeartCrack className="w-5 h-5 text-white" />
                    <span className="text-white text-sm font-medium">Pass</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-all duration-200 ${
                    sliderDragX > 30 ? 'opacity-100 scale-110' : 'opacity-40'
                  }`}>
                    <span className="text-white text-sm font-medium">Like</span>
                    <Heart className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>

                {/* Draggable Button */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-y-1/2 w-14 h-14 cursor-grab active:cursor-grabbing"
                  style={{
                    transform: `translate(calc(-50% + ${sliderDragX}px), -50%)`,
                    transition: isDraggingSlider ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseDown={handleSliderStart}
                  onTouchStart={handleSliderStart}
                >
                  <div className={`w-full h-full rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
                    sliderDragX > 30 
                      ? 'bg-gradient-to-br from-pink-500 to-rose-500 scale-110' 
                      : sliderDragX < -30
                      ? 'bg-gradient-to-br from-gray-600 to-gray-800 scale-110'
                      : 'bg-white'
                  }`}>
                    {sliderDragX > 30 ? (
                      <Heart className="w-7 h-7 text-white fill-white" />
                    ) : sliderDragX < -30 ? (
                      <HeartCrack className="w-7 h-7 text-white" />
                    ) : (
                      <Heart className="w-7 h-7 text-gray-700" />
                    )}
                  </div>
                </div>

                {/* Progress Fill */}
                {Math.abs(sliderDragX) > 10 && (
                  <div 
                    className={`absolute top-0 bottom-0 transition-all duration-100 ${
                      sliderDragX > 0 
                        ? 'left-1/2 bg-gradient-to-r from-pink-500/30 to-pink-500/10'
                        : 'right-1/2 bg-gradient-to-l from-gray-600/30 to-gray-600/10'
                    }`}
                    style={{
                      width: `${Math.abs(sliderDragX)}px`
                    }}
                  />
                )}
              </div>
              
              {/* Instruction Text */}
              <p className="text-center text-xs text-muted-foreground mt-2 opacity-70">
                Slide to pass or like
              </p>
            </div>
            
            {/* Desktop: Button Instruction */}
            <p className="text-center text-xs text-muted-foreground mt-2 opacity-70 hidden md:block">
              Use buttons or keyboard arrows
            </p>
          </div>
        ) : (
          <div className="max-w-sm mx-auto text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-elegant">
              <Zap className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">You're all caught up!</h3>
              <p className="text-muted-foreground">
                No new profiles right now. Check back later for fresh matches!
              </p>
            </div>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Detailed Profile Modal */}
      {showDetailedProfile && currentProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center">
          <div className="w-full md:w-[420px] md:max-w-[90vw] bg-card rounded-t-3xl md:rounded-3xl max-h-[95vh] md:max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="relative">
              <img
                src={currentProfile.profile_images?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face'}
                alt={currentProfile.first_name}
                className="w-full h-48 md:h-64 object-cover"
              />
              
              {/* Close Button - Better mobile positioning */}
              <div className="absolute top-3 left-3 md:top-4 md:left-4">
                <button
                  onClick={() => setShowDetailedProfile(false)}
                  className="w-9 h-9 md:w-10 md:h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm text-white border border-white/20"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
              
              {/* Premium Badge */}
              <div className="absolute top-3 right-3 md:top-4 md:right-4">
                <div className="bg-amber-500 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                  <span>⭐</span>
                  <span>PREMIUM</span>
                </div>
              </div>
              
              {/* Profile Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 md:p-6">
                <div className="text-white">
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-2 flex items-baseline space-x-3 tracking-tight">
                    <span>{currentProfile.first_name}</span>
                    <span className="text-2xl md:text-3xl font-bold opacity-80">{calculateAge(currentProfile.date_of_birth)}</span>
                  </h2>
                  <p className="text-sm md:text-base opacity-90 flex items-center space-x-2 mb-3 font-medium">
                    <span className="text-lg">📍</span>
                    <span>
                      {currentProfile.city || currentProfile.state || currentProfile.university || 'Location not set'}
                      {distance !== null && ` • ${Math.round(distance)} km away`}
                    </span>
                  </p>
                  
                  {/* Stats */}
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-20rem)] md:max-h-[calc(90vh-24rem)]">
              <div className="p-4 md:p-6 space-y-5 md:space-y-6">
                {/* About Section */}
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">About</h3>
                  <p className="text-muted-foreground text-base md:text-base leading-relaxed font-normal">
                    {currentProfile.bio || "No bio available yet."}
                  </p>
                  {currentProfile.relationship_goals && currentProfile.relationship_goals.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Looking for:</p>
                      <div className="flex flex-wrap gap-1">
                        {currentProfile.relationship_goals.map((goal, index) => (
                          <span key={index} className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Who You Are Section */}
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">Who You Are</h3>
                  
                  {/* Basic Information */}
                  <div className="bg-muted/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm">👤</span>
                      <h4 className="font-semibold text-sm">Basic Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Full Name:</span>
                        <p className="font-medium">{currentProfile.first_name} {currentProfile.last_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Age:</span>
                        <p className="font-medium">{calculateAge(currentProfile.date_of_birth)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">University:</span>
                        <p className="font-medium">{currentProfile.university || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">QCS Score:</span>
                        <p className="font-medium">{currentProfile.total_qcs || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Physical & Appearance - Expandable */}
                  <div className="bg-muted/30 rounded-lg mb-3">
                    <button 
                      onClick={() => toggleSection('physical')}
                      className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">💪</span>
                        <h4 className="font-semibold text-sm">Physical & Appearance</h4>
                      </div>
                      <span className={`text-sm transition-transform ${expandedSections.physical ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {expandedSections.physical && (
                      <div className="px-3 pb-3 text-xs space-y-2">
                        {currentProfile.gender && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gender:</span>
                            <span className="font-medium capitalize">{currentProfile.gender}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Height:</span>
                          <span className="font-medium">
                            {currentProfile.height ? `${currentProfile.height}cm` : 'Not specified'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Body Type:</span>
                          <span className="font-medium capitalize">
                            {currentProfile.body_type || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Face Type:</span>
                          <span className="font-medium capitalize">
                            {currentProfile.face_type || 'Not specified'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Personality & Lifestyle - with Compatibility Badges */}
                  <div className="bg-muted/30 rounded-lg mb-3">
                    <button 
                      onClick={() => toggleSection('personality')}
                      className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm">Personality & Lifestyle</h4>
                        <span className="text-[10px] text-muted-foreground">(Compatibility)</span>
                      </div>
                      <span className={`text-sm transition-transform ${expandedSections.personality ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {expandedSections.personality && (
                      <div className="px-3 pb-4 space-y-4">
                        {/* Personality Type Match */}
                        {currentProfile.personality_type && (
                          <CompatibilityGroup
                            title="Personality"
                            icon={<User className="w-4 h-4" />}
                            items={[
                              {
                                label: currentProfile.personality_type,
                                userValue: userProfile?.personality_type,
                                partnerValue: currentProfile.personality_type,
                                type: 'personality'
                              }
                            ]}
                          />
                        )}

                        {/* Lifestyle Match */}
                        {currentProfile.lifestyle && (
                          <CompatibilityGroup
                            title="Lifestyle"
                            icon={<Activity className="w-4 h-4" />}
                            items={[
                              {
                                label: currentProfile.lifestyle,
                                userValue: userProfile?.lifestyle,
                                partnerValue: currentProfile.lifestyle,
                                type: 'lifestyle'
                              }
                            ]}
                          />
                        )}

                        {/* Values Match */}
                        {currentProfile.values && Array.isArray(currentProfile.values) && currentProfile.values.length > 0 && (
                          <CompatibilityGroup
                            title="Values"
                            icon={<Heart className="w-4 h-4" />}
                            items={currentProfile.values.slice(0, 3).map((value: string) => ({
                              label: value,
                              userValue: userProfile?.values,
                              partnerValue: value,
                              type: 'value'
                            }))}
                          />
                        )}

                        {/* Interests Match */}
                        {currentProfile.interests && currentProfile.interests.length > 0 && (
                          <CompatibilityGroup
                            title="Interests"
                            icon={<Sparkles className="w-4 h-4" />}
                            items={currentProfile.interests.slice(0, 4).map((interest: string) => ({
                              label: interest,
                              userValue: userProfile?.interests,
                              partnerValue: interest,
                              type: 'interest'
                            }))}
                          />
                        )}

                        {/* Additional Info */}
                        <div className="pt-3 border-t border-border/50 space-y-2 text-xs">
                          {currentProfile.love_language && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Love Language:</span>
                              <CompatibilityBadge
                                label={currentProfile.love_language}
                                userValue={userProfile?.love_language}
                                partnerValue={currentProfile.love_language}
                              />
                            </div>
                          )}
                          {currentProfile.humor_type && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Humor Style:</span>
                              <CompatibilityBadge
                                label={currentProfile.humor_type}
                                userValue={(userProfile as any)?.humor_type}
                                partnerValue={currentProfile.humor_type}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compatibility Analysis - Always Visible */}
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 rounded-xl p-5 mb-3 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-xl">⚡</span>
                      <h4 className="font-bold text-base">Compatibility Analysis</h4>
                    </div>
                    {compatibilityLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader size={28} />
                        <span className="ml-2 text-sm text-muted-foreground">Calculating compatibility...</span>
                      </div>
                    ) : compatibility ? (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-3xl font-extrabold text-primary mb-1">{compatibility.overall_score}%</div>
                          <div className="text-xs font-medium text-muted-foreground">Overall Match</div>
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold text-green-500 mb-1">{compatibility.physical_score}%</div>
                          <div className="text-xs font-medium text-muted-foreground">Physical</div>
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold text-blue-500 mb-1">{compatibility.mental_score}%</div>
                          <div className="text-xs font-medium text-muted-foreground">Mental</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Compatibility score unavailable</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interests Section */}
                {currentProfile.interests && currentProfile.interests.length > 0 && (
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">Interests & Hobbies</h3>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {currentProfile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-primary/10 to-accent/10 text-foreground px-4 py-2 rounded-full text-sm md:text-base font-semibold border-2 border-primary/20 hover:scale-105 hover:shadow-md transition-all"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Photos */}
                {currentProfile.profile_images && currentProfile.profile_images.length > 1 && (
                  <div className="pb-2">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">More Photos</h3>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {currentProfile.profile_images.slice(1, 3).map((image, index) => (
                        <div key={index} className="aspect-square bg-muted rounded-lg md:rounded-xl overflow-hidden shadow-md">
                          <img 
                            src={image} 
                            alt={`${currentProfile.first_name} ${index + 2}`}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Fixed at Bottom */}
            <div className="p-4 md:p-6 border-t border-border/50 bg-gradient-to-br from-card/95 via-card/90 to-card/95 backdrop-blur-xl">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-2 border-white/60 dark:border-gray-700/60 hover:border-red-300 dark:hover:border-red-500 text-red-600 dark:text-red-400 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                  onClick={async () => {
                    await handleSwipe('left');
                    setShowDetailedProfile(false);
                  }}
                >
                  <X className="w-5 h-5 mr-2" strokeWidth={2.5} />
                  Pass
                </Button>

                <Button
                  size="lg"
                  className="flex-1 backdrop-blur-xl bg-gradient-to-br from-red-500/90 via-pink-500/90 to-rose-500/90 hover:from-red-600/95 hover:via-pink-600/95 hover:to-rose-600/95 border-2 border-red-400/50 hover:border-red-300/70 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                  onClick={async () => {
                    await handleSwipe('right');
                    setShowDetailedProfile(false);
                  }}
                >
                  <Heart className="w-5 h-5 mr-2 fill-white" strokeWidth={2} />
                  Like
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <WhoLikedMeModal
        isOpen={showWhoLikedMe}
        onClose={() => setShowWhoLikedMe(false)}
        onLike={() => {}}
      />

      {/* Photo Viewer Modal */}
      <Dialog open={showPhotoViewer} onOpenChange={setShowPhotoViewer}>
        <DialogContent className="w-screen h-screen max-w-none p-0 bg-black border-none m-0">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowPhotoViewer(false)}
              className="absolute top-4 right-4 z-50 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image Counter */}
            {currentProfile?.profile_images && currentProfile.profile_images.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
                <span className="text-white text-sm font-medium">
                  {photoViewerIndex + 1} / {currentProfile.profile_images.length}
                </span>
              </div>
            )}

            {/* Main Image Container */}
            <div className="w-full h-full flex items-center justify-center p-4 pb-24">
              <img
                src={currentProfile?.profile_images?.[photoViewerIndex] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1200&fit=crop&crop=face'}
                alt={`${currentProfile?.first_name} - Photo ${photoViewerIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Navigation Arrows */}
            {currentProfile?.profile_images && currentProfile.profile_images.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoViewerIndex((prev) => (prev - 1 + currentProfile.profile_images.length) % currentProfile.profile_images.length)}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
                >
                  <span className="text-white text-2xl md:text-3xl font-bold">‹</span>
                </button>
                <button
                  onClick={() => setPhotoViewerIndex((prev) => (prev + 1) % currentProfile.profile_images.length)}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
                >
                  <span className="text-white text-2xl md:text-3xl font-bold">›</span>
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {currentProfile?.profile_images && currentProfile.profile_images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 px-4">
                <div className="flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-xl mx-auto w-fit max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-hide">
                  {currentProfile.profile_images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPhotoViewerIndex(idx)}
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden transition-all flex-shrink-0 ${
                        idx === photoViewerIndex ? 'ring-2 ring-pink-500 scale-105' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedLayout>
  );
};

export default FlingzzHome;
