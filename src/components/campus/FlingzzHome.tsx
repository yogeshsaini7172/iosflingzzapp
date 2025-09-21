import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Flame,
  Zap
} from "lucide-react";
import { useProfilesFeed } from '@/hooks/useProfilesFeed';
import { useToast } from '@/hooks/use-toast';
import ChatNotificationBadge from '@/components/ui/chat-notification-badge';
import HeartNotificationBadge from '@/components/ui/heart-notification-badge';
import WhoLikedMeModal from '@/components/likes/WhoLikedMeModal';
import { useSwipeRealtime, useLikeRealtime, useNotificationRealtime } from '@/hooks/useRealtime';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useThreads } from '@/hooks/useThreads';

interface FlingzzHomeProps {
  onNavigate: (view: string) => void;
}

const FlingzzHome = ({ onNavigate }: FlingzzHomeProps) => {
  const { profiles, loading } = useProfilesFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showWhoLikedMe, setShowWhoLikedMe] = useState(false);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newThreadContent, setNewThreadContent] = useState('');
  
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchCurrentX, setTouchCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { threads, createThread } = useThreads();

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

  const getSwipeIndicatorColor = () => {
    if (swipeOffset > 50) return 'text-green-500';
    if (swipeOffset < -50) return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <UnifiedLayout title="FLINGZZ" showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <Flame className="w-12 h-12 text-primary animate-bounce" />
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
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-glow">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FLINGZZ
              </h1>
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
      {threads.length > 0 && (
        <div className="bg-card/30 backdrop-blur-sm px-4 py-2 border-b border-border/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">Community</h4>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
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
              <Button variant="ghost" size="sm" onClick={() => onNavigate('feed')} className="h-6 px-2 text-xs">
                All
              </Button>
            </div>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-1">
            {threads.slice(0, 5).map((thread) => (
              <div
                key={thread.id}
                className="flex-shrink-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-3 py-1 border border-primary/20"
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={thread.author?.profile_images?.[0]} />
                    <AvatarFallback className="text-xs">
                      <User className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-foreground font-medium">
                    {thread.author?.first_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[100px] truncate">
                    {thread.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Swipe Section */}
      <div className="flex-1 p-6">
        {currentProfile ? (
          <div className="max-w-sm mx-auto">
            {/* Swipe Up Style Card */}
            <div 
              className="relative bg-card rounded-3xl overflow-hidden shadow-2xl shadow-primary/10"
              style={{
                transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.1}deg)`,
                transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Premium Badge */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  PREMIUM
                </div>
              </div>

              {/* Image Dots */}
              {currentProfile.profile_images?.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                  {currentProfile.profile_images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Main Content */}
              <div className="flex flex-col h-[600px]">
                {/* Full Photo Section - 80% */}
                <div className="relative h-[480px] overflow-hidden">
                  <img
                    src={currentProfile.profile_images?.[currentImageIndex] || currentProfile.profile_images?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face'}
                    alt={currentProfile.first_name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image Navigation */}
                  {currentProfile.profile_images?.length > 1 && (
                    <>
                      <button
                        onClick={() => handleImageNavigation('prev')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm"
                      >
                        <span className="text-white text-sm">‹</span>
                      </button>
                      <button
                        onClick={() => handleImageNavigation('next')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm"
                      >
                        <span className="text-white text-sm">›</span>
                      </button>
                    </>
                  )}

                  {/* Swipe Indicators */}
                  {Math.abs(swipeOffset) > 20 && (
                    <div className={`absolute inset-0 flex items-center justify-center ${getSwipeIndicatorColor()}`}>
                      <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                        {swipeOffset > 0 ? (
                          <Heart className="w-8 h-8 fill-current" />
                        ) : (
                          <X className="w-8 h-8" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Profile Info Overlay at Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                    <div className="text-white">
                      <h3 className="text-2xl font-bold mb-1">
                        {currentProfile.first_name}, {calculateAge(currentProfile.date_of_birth)}
                      </h3>
                      <p className="text-sm opacity-90 mb-2 flex items-center space-x-1">
                        <span>📍</span>
                        <span>{currentProfile.university || 'IIT'}</span>
                        <span className="ml-4 text-red-400 font-bold">QCS 3333</span>
                      </p>
                      {currentProfile.interests && currentProfile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {currentProfile.interests.slice(0, 2).map((interest, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Section - 20% */}
                <div className="p-4 bg-card flex items-center justify-center">
                  <button 
                    className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
                    onClick={() => setShowDetailedProfile(true)}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Swipe up for more</span>
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-white" />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-6 mt-6">
              <Button
                size="lg"
                variant="outline"
                className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 bg-white"
                onClick={() => handleSwipe('left')}
              >
                <X className="w-6 h-6 text-gray-600" />
              </Button>
              
              <Button
                size="lg"
                className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-lg hover:shadow-xl"
                onClick={() => handleSwipe('right')}
              >
                <Heart className="w-7 h-7 fill-current text-white" />
              </Button>
            </div>

            {/* Swipe Hint */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              Swipe right to like • Swipe left to pass
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-card rounded-t-3xl max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="relative">
              <img
                src={currentProfile.profile_images?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face'}
                alt={currentProfile.first_name}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 left-4">
                <button
                  onClick={() => setShowDetailedProfile(false)}
                  className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  ⭐ PREMIUM
                </div>
              </div>
              
              {/* Profile Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {currentProfile.first_name} {calculateAge(currentProfile.date_of_birth)} ♡
                    </h2>
                    <p className="text-sm opacity-90 flex items-center space-x-1">
                      <span>📍</span>
                      <span>USA, {currentProfile.university || 'California'}</span>
                    </p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex space-x-4 mt-4">
                  <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                    <span>📍</span>
                    <span>2.5km</span>
                  </div>
                  <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                    <span>⚖️</span>
                    <span>55Kg</span>
                  </div>
                  <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                    <span>📏</span>
                    <span>178cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* About Section */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-3">About</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  🍃 Hi! When a user passes on a match, the conversation would close for both users and neither can message anymore 😊
                  <br /><br />
                  Finally hereafter losing all the hopes of finding the right all. I love Netflix, horses and books!
                </p>
              </div>

              {/* More Info Section */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-3">More info</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: "👤", label: "Women" },
                    { icon: "💃", label: "Ballet dancer" },
                    { icon: "🎓", label: "Harvard" },
                    { icon: "🐱", label: "Have cat" },
                    { icon: "🎯", label: "Hobby" },
                    { icon: "⭐", label: "I like it!" },
                    { icon: "🌙", label: "Sometimes" },
                    { icon: "🍷", label: "Sometimes" }
                  ].map((item, index) => (
                    <div key={index} className="bg-muted rounded-full px-3 py-2 text-xs flex items-center space-x-2">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Archive Section */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-3">Archive</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square bg-muted rounded-xl overflow-hidden">
                    <img src={currentProfile.profile_images?.[1] || currentProfile.profile_images?.[0]} alt="Archive" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square bg-muted rounded-xl overflow-hidden">
                    <img src={currentProfile.profile_images?.[2] || currentProfile.profile_images?.[0]} alt="Archive" className="w-full h-full object-cover" />
                  </div>
                </div>
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
    </UnifiedLayout>
  );
};

export default FlingzzHome;