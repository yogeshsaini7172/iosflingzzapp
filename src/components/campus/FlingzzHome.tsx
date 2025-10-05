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
  Trash2
} from "lucide-react";
import { fetchProfilesFeed } from '@/services/profile';
import { useToast } from '@/hooks/use-toast';
import ChatNotificationBadge from '@/components/ui/chat-notification-badge';
import HeartNotificationBadge from '@/components/ui/heart-notification-badge';
import WhoLikedMeModal from '@/components/likes/WhoLikedMeModal';
import { useSwipeRealtime, useLikeRealtime, useNotificationRealtime } from '@/hooks/useRealtime';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useThreads } from '@/hooks/useThreads';
import { calculateCompatibility, type CompatibilityScore } from '@/services/compatibility';
import { getCurrentLocation, calculateDistance, type LocationData } from '@/utils/locationUtils';


interface FlingzzHomeProps {
  onNavigate: (view: string) => void;
}

const FlingzzHome = ({ onNavigate }: FlingzzHomeProps) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showWhoLikedMe, setShowWhoLikedMe] = useState(false);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newThreadContent, setNewThreadContent] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<{id: string, content: string} | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchCurrentX, setTouchCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [compatibility, setCompatibility] = useState<CompatibilityScore | null>(null);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  
  // Slider button state
  const [sliderDragX, setSliderDragX] = useState(0);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [sliderStartX, setSliderStartX] = useState(0);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { threads, loading: threadsLoading, error: threadsError, createThread, deleteThread, updateThread } = useThreads();

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
    if (currentIndex >= profiles.length || !user?.uid) return;

    const currentProfile = profiles[currentIndex];

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
    }
  };

  const handlePostThread = async () => {
    if (!newThreadContent.trim()) {
      toast({
        title: "Error",
        description: "Please write something to share!",
        variant: "destructive"
      });
      return;
    }

    const success = await createThread(newThreadContent);
    if (success) {
      setNewThreadContent('');
      setIsPostModalOpen(false);
      toast({
        title: "Thread posted! 🎉",
        description: "Your thought has been shared with the community.",
      });
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
        setCompatibilityLoading(true);
        try {
          if (!user?.uid || !currentProfile?.user_id) {
            setCompatibility(null);
            setCompatibilityLoading(false);
            return;
          }
          const result = await calculateCompatibility(user.uid, currentProfile.user_id);
          if (result) {
            // Defensive check for NaN or undefined scores
            const overall = isNaN(result.overall_score) ? 0 : result.overall_score;
            const physical = isNaN(result.physical_score) ? 0 : result.physical_score;
            const mental = isNaN(result.mental_score) ? 0 : result.mental_score;
            setCompatibility({
              ...result,
              overall_score: overall,
              physical_score: physical,
              mental_score: mental,
            });
          } else {
            setCompatibility(null);
          }
        } catch (error) {
          console.error('Error calculating compatibility:', error);
          setCompatibility(null);
        } finally {
          setCompatibilityLoading(false);
        }
      };
      computeCompatibility();
    } else {
      setCompatibility(null);
      setCompatibilityLoading(false);
    }
  }, [currentProfile, user?.uid]);

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!currentProfile?.profile_images || currentProfile.profile_images.length <= 1) return;
    
    const totalImages = currentProfile.profile_images.length;
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

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
    const deltaX = touchCurrentX - touchStartX;
    const threshold = 100;
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    } else {
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
            <img src="logo.png" alt="FLINGZZ Logo" className="w-14 h-14 rounded-2xl shadow-glow animate-bounce" />
            <p className="text-lg font-medium">Finding matches...</p>
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

      {/* Compact Community Threads */}
      <div className="bg-card/30 backdrop-blur-sm px-4 py-2 border-b border-border/10">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">Community</h4>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-6 px-2 text-xs bg-pink-500 hover:bg-pink-600 text-white border border-pink-400 rounded-md">
                    <Plus className="w-3 h-3 mr-1" />
                    Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <MessageCircle className="w-5 h-5" />
                      <span>Share Your Thoughts</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="thread-content">What's on your mind?</Label>
                      <Textarea
                        id="thread-content"
                        placeholder="Share something interesting with the community..."
                        value={newThreadContent}
                        onChange={(e) => setNewThreadContent(e.target.value)}
                        className="min-h-[120px] resize-none"
                        maxLength={280}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Be authentic, be you ✨</span>
                        <span>{newThreadContent.length}/280</span>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsPostModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handlePostThread} disabled={!newThreadContent.trim()}>
                        <Send className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {threadsError ? (
            <div className="text-center py-2">
              <p className="text-xs text-red-500">Failed to load threads. Please try again.</p>
            </div>
          ) : threadsLoading ? (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">Loading threads...</p>
            </div>
          ) : threads.length > 0 ? (
            <div className="flex space-x-2 overflow-x-auto pb-1">
              {(() => {
                if (!user?.uid) return threads.slice(0, 5);
                const ownThread = threads.find(thread => thread.user_id === user.uid);
                const otherThreads = threads.filter(thread => thread.user_id !== user.uid);
                const reorderedThreads = ownThread ? [ownThread, ...otherThreads] : otherThreads;
                return reorderedThreads.slice(0, 5);
              })().map((thread) => (
                <div
                  key={thread.id}
                  className="flex-shrink-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-3 py-1 border border-primary/20 relative group"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={thread.author?.profile_images?.[0]} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs flex items-center justify-center">
                        <User className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <p className={`text-xs font-medium ${
                      thread.user_id === user?.uid
                        ? 'text-pink-500'
                        : 'text-foreground'
                    }`}>
                      {thread.user_id === user?.uid
                        ? 'you'
                        : (thread.author?.first_name || 'Anonymous')
                      }
                    </p>
                    <p className="text-xs text-muted-foreground max-w-[100px] truncate">
                      {thread.content}
                    </p>
                    {/* Dropdown Menu - Only show for own threads */}
                    {thread.user_id === user?.uid && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded-full">
                            <MoreVertical className="w-3 h-3 text-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingThread({ id: thread.id, content: thread.content });
                              setEditContent(thread.content);
                              setIsEditModalOpen(true);
                            }}
                            className="text-xs"
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              const success = await deleteThread(thread.id);
                              if (success) {
                                toast({
                                  title: "Thread deleted! 🗑️",
                                  description: "Your thread has been removed.",
                                });
                              }
                            }}
                            className="text-xs text-red-600"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">No threads yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Swipe Section */}
      <div className="flex-1 flex items-center justify-center px-3 pb-24">
        {currentProfile ? (
          <div className="w-full max-w-md h-[calc(100vh-200px)] flex flex-col">
            {/* Swipe Card */}
            <div 
              className="relative bg-card rounded-3xl overflow-hidden shadow-2xl flex-1 transition-all duration-300"
              style={{
                transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)`,
                transition: isSwiping ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.3), 0 0 40px -10px rgba(var(--primary), 0.2)'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
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
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation Arrows */}
                {currentProfile.profile_images?.length > 1 && (
                  <>
                    <button
                      onClick={() => handleImageNavigation('prev')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                    >
                      <span className="text-white text-xl font-bold">‹</span>
                    </button>
                    <button
                      onClick={() => handleImageNavigation('next')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                    >
                      <span className="text-white text-xl font-bold">›</span>
                    </button>
                  </>
                )}

                {/* Swipe Direction Indicators */}
                {Math.abs(swipeOffset) > 20 && (
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${getSwipeIndicatorColor()}`}>
                    <div className={`rounded-full p-4 backdrop-blur-md transition-all animate-scale-in ${
                      swipeOffset > 0 ? 'bg-green-500/30' : 'bg-red-500/30'
                    }`}>
                      {swipeOffset > 0 ? (
                        <Heart className="w-12 h-12 fill-current drop-shadow-2xl" />
                      ) : (
                        <X className="w-12 h-12 drop-shadow-2xl" />
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Profile Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-5 pb-4">
                  <div className="text-white space-y-3">
                    {/* Name & Age */}
                    <div>
                      <h3 className="text-3xl font-bold mb-1 flex items-center space-x-2 drop-shadow-lg">
                        <span>{currentProfile.first_name}</span>
                        <span className="text-2xl font-medium opacity-90">{calculateAge(currentProfile.date_of_birth)}</span>
                      </h3>
                      <p className="text-sm opacity-90 flex items-center space-x-2">
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
                    <div className="flex flex-wrap gap-2">
                      {distance !== null && (
                        <div className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/20">
                          📍 {distance.toFixed(1)}km away
                        </div>
                      )}
                      {currentProfile.height && (
                        <div className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/20">
                          📏 {currentProfile.height}cm
                        </div>
                      )}
                      {currentProfile.profession && (
                        <div className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/20 max-w-[150px] truncate">
                          💼 {currentProfile.profession}
                        </div>
                      )}
                    </div>

                    {/* Compatibility Scores */}
                    {compatibility && !compatibilityLoading && (
                      <div className="grid grid-cols-3 gap-3 py-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-300">{compatibility.overall_score}%</div>
                          <div className="text-[10px] text-white/70">Overall</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-300">{compatibility.physical_score}%</div>
                          <div className="text-[10px] text-white/70">Physical</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-300">{compatibility.mental_score}%</div>
                          <div className="text-[10px] text-white/70">Mental</div>
                        </div>
                      </div>
                    )}

                    {/* Interests */}
                    {currentProfile.interests && currentProfile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.interests.slice(0, 3).map((interest, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 bg-white/15 backdrop-blur-md text-white text-xs rounded-full border border-white/20"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* View Full Profile Button */}
                    <button 
                      className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-2xl text-sm font-medium transition-all border border-white/20 hover:border-white/30 active:scale-95"
                      onClick={() => setShowDetailedProfile(true)}
                    >
                      <Zap className="w-4 h-4" />
                      <span>View Full Profile</span>
                      <span className="text-lg">↑</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Controls - Responsive Design */}
            
            {/* Mobile Slider Design */}
            <div className="block md:hidden relative w-full max-w-sm mt-5 mx-auto">
              <div className="relative bg-gradient-to-r from-red-500/10 via-muted/50 to-pink-500/10 rounded-full h-20 flex items-center justify-between px-8 backdrop-blur-md border-2 border-border/50 overflow-hidden shadow-2xl">
                {/* Animated Progress Fill */}
                <div 
                  className="absolute inset-0 transition-all duration-200 rounded-full"
                  style={{
                    background: sliderDragX < -80 
                      ? 'linear-gradient(to left, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.2), transparent)'
                      : sliderDragX > 80
                      ? 'linear-gradient(to right, rgba(236, 72, 153, 0.4), rgba(219, 39, 119, 0.2), transparent)'
                      : 'transparent',
                    boxShadow: sliderDragX < -80 
                      ? 'inset 0 0 30px rgba(239, 68, 68, 0.3)'
                      : sliderDragX > 80
                      ? 'inset 0 0 30px rgba(236, 72, 153, 0.3)'
                      : 'none'
                  }}
                />
                
                {/* Pass Label with Icon */}
                <div className={`flex flex-col items-center transition-all duration-300 relative z-10 ${
                  sliderDragX < -50 ? 'scale-125' : 'scale-100'
                }`}>
                  <X className={`w-6 h-6 mb-1 transition-all duration-300 ${
                    sliderDragX < -80 ? 'text-red-500 animate-bounce' : 'text-muted-foreground'
                  }`} strokeWidth={2.5} />
                  <span className={`text-xs font-bold transition-all duration-300 ${
                    sliderDragX < -50 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    Pass
                  </span>
                </div>

                {/* Like Label with Icon */}
                <div className={`flex flex-col items-center transition-all duration-300 relative z-10 ${
                  sliderDragX > 50 ? 'scale-125' : 'scale-100'
                }`}>
                  <Heart className={`w-6 h-6 mb-1 transition-all duration-300 ${
                    sliderDragX > 80 ? 'text-pink-500 fill-pink-500 animate-bounce' : 'text-muted-foreground'
                  }`} strokeWidth={2.5} />
                  <span className={`text-xs font-bold transition-all duration-300 ${
                    sliderDragX > 50 ? 'text-pink-500' : 'text-muted-foreground'
                  }`}>
                    Like
                  </span>
                </div>

                {/* Draggable Button with Morphing Design */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20"
                  style={{
                    transform: `translate(calc(-50% + ${sliderDragX}px), -50%) scale(${isDraggingSlider ? 1.2 : 1}) rotate(${sliderDragX * 0.2}deg)`,
                    transition: isDraggingSlider ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  onMouseDown={handleSliderStart}
                  onMouseMove={handleSliderMove}
                  onMouseUp={handleSliderEnd}
                  onMouseLeave={handleSliderEnd}
                  onTouchStart={handleSliderStart}
                  onTouchMove={handleSliderMove}
                  onTouchEnd={handleSliderEnd}
                >
                  <div 
                    className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                      sliderDragX < -80 ? 'bg-gradient-to-br from-red-500 to-red-600 ring-4 ring-red-300/50 animate-pulse' :
                      sliderDragX > 80 ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 ring-4 ring-pink-300/50 animate-pulse' :
                      'bg-gradient-to-br from-white to-gray-100'
                    }`}
                  >
                    {/* Multiple Glow Layers */}
                    {sliderDragX < -80 && (
                      <>
                        <div className="absolute inset-0 bg-white/40 animate-ping rounded-full" />
                        <div className="absolute inset-0 bg-red-400/30 blur-xl rounded-full animate-pulse" />
                      </>
                    )}
                    {sliderDragX > 80 && (
                      <>
                        <div className="absolute inset-0 bg-white/40 animate-ping rounded-full" />
                        <div className="absolute inset-0 bg-pink-400/30 blur-xl rounded-full animate-pulse" />
                      </>
                    )}
                    
                    {/* Icon with Advanced States */}
                    {sliderDragX < -80 ? (
                      <div className="relative">
                        <X className="w-9 h-9 text-white drop-shadow-2xl animate-bounce" strokeWidth={3.5} />
                        {/* Explosion particles */}
                        <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-300 rounded-full animate-ping" />
                        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-red-300 rounded-full animate-ping" style={{ animationDelay: '0.15s' }} />
                        <div className="absolute -top-2 -left-2 w-2 h-2 bg-red-200 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                      </div>
                    ) : sliderDragX < -50 ? (
                      <div className="relative">
                        <Heart className="w-8 h-8 text-red-500 transition-all duration-200" strokeWidth={2.5} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-0.5 h-10 bg-red-500 rotate-12" style={{ opacity: (Math.abs(sliderDragX) - 50) / 30 }} />
                        </div>
                      </div>
                    ) : sliderDragX > 80 ? (
                      <div className="relative">
                        <Heart className="w-9 h-9 text-white fill-white drop-shadow-2xl animate-bounce" strokeWidth={3.5} />
                        {/* Heart particles */}
                        <div className="absolute -top-2 -right-2 w-3 h-3 bg-pink-300 rounded-full animate-ping" />
                        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-pink-300 rounded-full animate-ping" style={{ animationDelay: '0.1s' }} />
                        <div className="absolute top-0 left-0 w-2 h-2 bg-pink-200 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-pink-200 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                      </div>
                    ) : sliderDragX > 50 ? (
                      <Heart 
                        className="w-8 h-8 text-pink-500 transition-all duration-200"
                        style={{
                          fill: `rgba(236, 72, 153, ${(sliderDragX - 50) / 50})`
                        }}
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Heart className="w-8 h-8 text-muted-foreground transition-all duration-200" strokeWidth={2.5} />
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Direction Hints */}
              <div className="mt-4 text-center">
                {isDraggingSlider ? (
                  <div className="animate-fade-in">
                    <p className={`text-sm font-bold transition-all duration-200 ${
                      sliderDragX < -80 ? 'text-red-500 scale-110 animate-pulse' :
                      sliderDragX > 80 ? 'text-pink-500 scale-110 animate-pulse' :
                      'text-muted-foreground'
                    }`}>
                      {sliderDragX < -80 ? '✓ Release to Pass' : 
                       sliderDragX > 80 ? '✓ Release to Like' : 
                       sliderDragX < -50 ? '← Keep sliding...' :
                       sliderDragX > 50 ? 'Keep sliding... →' :
                       'Slide left or right'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground opacity-70">
                    Drag the button or swipe card
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Button Design */}
            <div className="hidden md:flex items-center justify-center gap-8 mt-8">
              {/* Pass Button - Desktop */}
              <button
                onClick={() => handleSwipe('left')}
                className="group relative"
              >
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-red-500/20 active:scale-95 border-2 border-gray-200 hover:border-red-300">
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/20 group-hover:to-red-600/20 transition-all duration-300" />
                  
                  {/* Icon */}
                  <X className="w-10 h-10 text-red-500 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300 relative z-10" strokeWidth={2.5} />
                  
                  {/* Animated ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-red-500 scale-0 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                </div>
                
                {/* Label */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-red-500 transition-colors">
                    Pass
                  </span>
                </div>
              </button>

              {/* Like Button - Desktop */}
              <button
                onClick={() => handleSwipe('right')}
                className="group relative"
              >
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-pink-500/40 active:scale-95 border-2 border-pink-300">
                  {/* Animated pulse */}
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
                  
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-300/0 to-rose-300/0 group-hover:from-pink-300/30 group-hover:to-rose-300/30 transition-all duration-300" />
                  
                  {/* Icon */}
                  <Heart className="w-12 h-12 text-white fill-white group-hover:scale-125 transition-all duration-300 relative z-10 drop-shadow-lg" strokeWidth={2.5} />
                  
                  {/* Particle effects */}
                  <div className="absolute top-2 right-2 w-2 h-2 bg-pink-200 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                  <div className="absolute bottom-3 left-3 w-2 h-2 bg-pink-200 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.1s' }} />
                  <div className="absolute top-4 left-2 w-1.5 h-1.5 bg-pink-100 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.2s' }} />
                  
                  {/* Animated ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-pink-300 scale-0 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                </div>
                
                {/* Label */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-sm font-medium text-pink-500 group-hover:text-pink-400 transition-colors">
                    Like
                  </span>
                </div>
              </button>
            </div>

            {/* Hint Text */}
            <p className="text-center text-xs text-muted-foreground mt-12 opacity-70">
              <span className="md:hidden">Swipe card or drag button</span>
              <span className="hidden md:inline">Click buttons or swipe card</span>
            </p>
          </div>
        ) : (
          <div className="max-w-sm mx-auto text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-12 h-12 text-primary-foreground" />
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
                  <h2 className="text-xl md:text-2xl font-bold mb-1 flex items-center space-x-2">
                    <span>{currentProfile.first_name}</span>
                    <span className="text-lg md:text-xl">{calculateAge(currentProfile.date_of_birth)}</span>
                    <span className="text-red-400">♡</span>
                  </h2>
                  <p className="text-xs md:text-sm opacity-90 flex items-center space-x-1 mb-3">
                    <span>📍</span>
                    <span>USA, {currentProfile.university || 'University'}</span>
                  </p>
                  
                  {/* Stats */}
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-12rem)] md:max-h-[calc(90vh-16rem)]">
              <div className="p-4 md:p-6 space-y-5 md:space-y-6">
                {/* About Section */}
                <div>
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3">About</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
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
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-3">Who You Are</h3>
                  
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

                  {/* Personality & Lifestyle - Expandable */}
                  <div className="bg-muted/30 rounded-lg mb-3">
                    <button 
                      onClick={() => toggleSection('personality')}
                      className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">🧠</span>
                        <h4 className="font-semibold text-sm">Personality & Lifestyle</h4>
                      </div>
                      <span className={`text-sm transition-transform ${expandedSections.personality ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {expandedSections.personality && (
                      <div className="px-3 pb-3 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Personality Type:</span>
                          <span className="font-medium capitalize">
                            {currentProfile.personality_type || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lifestyle:</span>
                          <span className="font-medium capitalize">
                            {currentProfile.lifestyle || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Values:</span>
                          <span className="font-medium">
                            {currentProfile.values && Array.isArray(currentProfile.values) && currentProfile.values.length > 0
                              ? currentProfile.values.join(', ')
                              : 'Not specified'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Love Language:</span>
                          <span className="font-medium capitalize">
                            {currentProfile.love_language || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Humor Style:</span>
                          <span className="font-medium capitalize">
                            {currentProfile.humor_type || 'Not specified'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compatibility Analysis - Always Visible */}
                  <div className="bg-muted/30 rounded-lg p-4 mb-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm">⚡</span>
                      <h4 className="font-semibold text-sm">Compatibility Analysis</h4>
                    </div>
                    {compatibilityLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">Calculating compatibility...</span>
                      </div>
                    ) : compatibility ? (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">{compatibility.overall_score}%</div>
                          <div className="text-xs text-muted-foreground">Overall Match</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-500">{compatibility.physical_score}%</div>
                          <div className="text-xs text-muted-foreground">Physical</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-500">{compatibility.mental_score}%</div>
                          <div className="text-xs text-muted-foreground">Mental</div>
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
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-primary/10 to-accent/10 text-foreground px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Photos */}
                {currentProfile.profile_images && currentProfile.profile_images.length > 1 && (
                  <div className="pb-4">
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3">More Photos</h3>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {currentProfile.profile_images.slice(1, 3).map((image, index) => (
                        <div key={index} className="aspect-square bg-muted rounded-lg md:rounded-xl overflow-hidden">
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
          </div>
        </div>
      )}

      {/* Edit Thread Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5" />
              <span>Edit Thread</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-thread-content">Update your thoughts</Label>
              <Textarea
                id="edit-thread-content"
                placeholder="Share something interesting with the community..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={280}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Be authentic, be you ✨</span>
                <span>{editContent.length}/280</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setEditingThread(null);
                setEditContent('');
              }}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingThread || !editContent.trim()) return;

                  const success = await updateThread(editingThread.id, editContent);
                  if (success) {
                    setIsEditModalOpen(false);
                    setEditingThread(null);
                    setEditContent('');
                  }
                }}
                disabled={!editContent.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WhoLikedMeModal
        isOpen={showWhoLikedMe}
        onClose={() => setShowWhoLikedMe(false)}
        onLike={() => {}}
      />
    </UnifiedLayout>
  );
};

export default FlingzzHome;
