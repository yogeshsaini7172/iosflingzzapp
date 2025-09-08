import { useState, useEffect } from "react";
import GenZBackground from '@/components/ui/genZ-background';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  MapPin,
  Star,
  Shield,
  Plus,
  Crown,
  Send,
  MessageCircle,
  Bell
} from "lucide-react";
import { useProfilesFeed } from '@/hooks/useProfilesFeed';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ChatNotificationBadge from '@/components/ui/chat-notification-badge';
import HeartNotificationBadge from '@/components/ui/heart-notification-badge';
import WhoLikedMeModal from '@/components/likes/WhoLikedMeModal';
import ChatRequestsModal from '@/components/notifications/ChatRequestsModal';
import { useSwipeRealtime, useLikeRealtime, useNotificationRealtime } from '@/hooks/useRealtime';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import ProfileImageHandler from '@/components/common/ProfileImageHandler';
import { useAuth } from '@/contexts/AuthContext';
import { useThreads } from '@/hooks/useThreads';

// Thread interface now comes from useThreads hook

interface DateSigmaHomeProps {
  onNavigate: (view: string) => void;
}

// Threads are now loaded from database via useThreads hook

const DateSigmaHome = ({ onNavigate }: DateSigmaHomeProps) => {
  const { profiles, loading } = useProfilesFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isRewriteModalOpen, setIsRewriteModalOpen] = useState(false);
  const [newThreadContent, setNewThreadContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [rewriteContent, setRewriteContent] = useState('');
  const [selectedThreadForReply, setSelectedThreadForReply] = useState<any>(null);
  const [selectedThreadForRewrite, setSelectedThreadForRewrite] = useState<any>(null);
  const [showWhoLikedMe, setShowWhoLikedMe] = useState(false);
  const { toast } = useToast();

  // Use threads hook for database integration
  const { 
    threads, 
    loading: threadsLoading, 
    likedThreads, 
    createThread, 
    likeThread, 
    replyToThread, 
    updateThread, 
    deleteThread 
  } = useThreads();

  const { user } = useAuth();
  const getCurrentUserId = () => {
    if (!user?.uid) {
      throw new Error('User authentication required');
    }
    return user.uid;
  };

  const getCurrentUserProfile = () => {
    return {
      name: user?.displayName || 'You',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
    };
  };

  // Set up realtime listeners
  const userId = user?.uid;
  
  // Listen for new matches
  if (userId) {
    useSwipeRealtime(userId, (match) => {
      toast({
        title: "New Match! 💕",
        description: "You have a new mutual match!",
      });
    });

    // Listen for new likes
    useLikeRealtime(userId, (like) => {
      toast({
        title: "Someone liked you! ❤️",
        description: "Check your likes to see who it is!",
      });
    });

    // Listen for notifications
    useNotificationRealtime(userId, (notification) => {
      toast({
        title: notification.title,
        description: notification.message,
      });
    });
  }

  // Threads are now persisted in database via useThreads hook

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
    }
  };

  const handleLikeThread = (threadId: string) => {
    likeThread(threadId);
  };

  const handleReplyToThread = (thread: any) => {
    setSelectedThreadForReply(thread);
    setIsReplyModalOpen(true);
    setReplyContent('');
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !selectedThreadForReply) {
      toast({
        title: "Error",
        description: "Please write a reply!",
        variant: "destructive"
      });
      return;
    }

    const success = await replyToThread(selectedThreadForReply.id, replyContent);
    if (success) {
      setIsReplyModalOpen(false);
      setReplyContent('');
      setSelectedThreadForReply(null);
    }
  };

  const handleRewriteThread = (thread: any) => {
    setSelectedThreadForRewrite(thread);
    setRewriteContent(thread.content);
    setIsRewriteModalOpen(true);
  };

  const handleSubmitRewrite = async () => {
    if (!rewriteContent.trim() || !selectedThreadForRewrite) {
      toast({
        title: "Error",
        description: "Please write something to update your thread!",
        variant: "destructive"
      });
      return;
    }

    const success = await updateThread(selectedThreadForRewrite.id, rewriteContent);
    if (success) {
      setIsRewriteModalOpen(false);
      setRewriteContent('');
      setSelectedThreadForRewrite(null);
    }
  };

  const handleDeleteThread = (threadId: string) => {
    deleteThread(threadId);
  };

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
    const userId = user.uid;

     try {
       // Call the enhanced-swipe-action via fetchWithFirebaseAuth
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

       // Handle match result
       if (data?.matched) {
        console.log('🎉 Match detected!', data);
        toast({
          title: "It's a Match! 🎉",
          description: `You and ${currentProfile.first_name} liked each other!`,
        });
      } else if (direction === 'right') {
        toast({
          title: 'Like sent! 💖',
          description: "We'll let you know if they like you back.",
        });
      }

      // Update UI
      setCurrentIndex(prev => prev + 1);
      setSwipeCount(prev => prev + 1);
      setCurrentImageIndex(0); // Reset image index for next profile

      // No extra check needed here; edge function already handles mutual like,
      // match creation, chat room creation, and notifications.
      // We just continue to next profile.


    } catch (error) {
      console.error('Error handling swipe:', error);
      setCurrentIndex(prev => prev + 1);
      setSwipeCount(prev => prev + 1);
      setCurrentImageIndex(0); // Reset image index for next profile
    }
  };

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
    <UnifiedLayout title="DateSigma Home" showHeader={false}>
      {/* Custom Header for Home */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-sm">DS</span>
            </div>
            <h1 className="text-base font-display font-bold text-foreground">DateSigma</h1>
          </div>
          <div className="flex items-center space-x-2">
            <HeartNotificationBadge 
              onClick={() => setShowWhoLikedMe(true)}
            />
            <ChatNotificationBadge 
              onClick={() => onNavigate('chat')}
            />
          </div>
        </div>
      </div>

      {/* Threads Section */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-foreground">Community Threads</h2>
        </div>
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
          {/* Add Today's Thread Option OR User's Thread Management */}
          {(() => {
            const userThreads = threads.filter(t => t.user_id === (user?.uid || ''));
            
            if (userThreads.length === 0) {
              // Show "Add Today's Thread" if user has no threads
              return (
                <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
                  <DialogTrigger asChild>
                    <div className="flex-shrink-0 w-64">
                      <Card className="p-4 bg-gradient-primary text-primary-foreground border-0 hover:shadow-glow transition-all cursor-pointer">
                        <div className="flex items-center justify-center space-x-2 mb-3">
                          <Plus className="w-5 h-5" />
                          <span className="font-semibold text-sm">Share Your Thoughts</span>
                        </div>
                        <p className="text-xs text-primary-foreground/90 text-center">What's on your mind today?</p>
                      </Card>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Share Your Thoughts</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="thread-content">What's on your mind?</Label>
                        <Textarea
                          id="thread-content"
                          placeholder="Share your thoughts, experiences, or advice with the community..."
                          value={newThreadContent}
                          onChange={(e) => setNewThreadContent(e.target.value)}
                          className="min-h-[100px]"
                          maxLength={280}
                        />
                        <div className="text-right text-xs text-muted-foreground">
                          {newThreadContent.length}/280 characters
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsPostModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handlePostThread}
                          disabled={!newThreadContent.trim()}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Post Thread
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            } else {
              // Show user's thread management options
              const latestUserThread = userThreads[0];
              const threadAuthor = latestUserThread.author?.first_name || 'You';
              return (
                <div className="flex-shrink-0 w-64">
                  <Card className="p-4 bg-gradient-secondary text-secondary-foreground border-0">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <User className="w-4 h-4" />
                          <span className="font-semibold text-sm">Your Thread</span>
                        </div>
                        <p className="text-xs text-secondary-foreground/90 line-clamp-2">{latestUserThread.content}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          variant="ghost" 
                          className="flex-1 text-secondary-foreground hover:bg-secondary-foreground/20"
                          onClick={() => handleRewriteThread(latestUserThread)}
                        >
                          <span className="text-xs">Edit</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="flex-1 text-secondary-foreground hover:bg-destructive/20"
                          onClick={() => handleDeleteThread(latestUserThread.id)}
                        >
                          <span className="text-xs">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            }
          })()}

          {/* Thread Cards - Now Dynamic with Reply/Like Options */}
          {threads.slice(0, 5).map((thread) => {
            const isLiked = likedThreads.has(thread.id);
            const isOwnThread = thread.user_id === user?.uid;
            const threadAuthor = thread.author?.first_name || 'Anonymous';
            const threadAvatar = thread.author?.profile_images?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150';
            const timeAgo = new Date(thread.created_at).toLocaleString();
            
            return (
              <div key={thread.id} className="flex-shrink-0 w-72">
                <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card transition-colors h-full">
                  <div className="flex space-x-3 mb-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={threadAvatar} alt={threadAuthor} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                        {threadAuthor.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm text-foreground truncate flex items-center">
                          {threadAuthor}
                          {isOwnThread && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-3 line-clamp-3">{thread.content}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex space-x-3">
                      <button 
                        className={`flex items-center space-x-1 hover:text-primary transition-colors ${
                          isLiked ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        onClick={() => handleLikeThread(thread.id)}
                      >
                        <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{thread.likes_count}</span>
                      </button>
                      
                      {!isOwnThread && (
                        <button 
                          className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => handleReplyToThread(thread)}
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      )}
                    </div>
                    <span className="text-muted-foreground">{thread.replies_count} replies</span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Reply Modal */}
        <Dialog open={isReplyModalOpen} onOpenChange={setIsReplyModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-rose-700">Reply to {selectedThreadForReply?.author}</DialogTitle>
            </DialogHeader>
            {selectedThreadForReply && (
              <div className="space-y-4">
                <div className="p-3 bg-rose-50 rounded-lg">
                  <p className="text-sm text-rose-600 italic">"{selectedThreadForReply.content}"</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reply-content">Your reply:</Label>
                  <Textarea
                    id="reply-content"
                    placeholder="Write your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px] border-rose-200 focus:border-rose-400"
                    maxLength={280}
                  />
                  <div className="text-right text-xs text-rose-500">
                    {replyContent.length}/280 characters
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsReplyModalOpen(false)}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitReply}
                    className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600"
                    disabled={!replyContent.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Post Reply
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rewrite Modal */}
        <Dialog open={isRewriteModalOpen} onOpenChange={setIsRewriteModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-rose-700">Rewrite Your Thread</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rewrite-content">Edit your thread:</Label>
                <Textarea
                  id="rewrite-content"
                  placeholder="Rewrite your thoughts..."
                  value={rewriteContent}
                  onChange={(e) => setRewriteContent(e.target.value)}
                  className="min-h-[100px] border-rose-200 focus:border-rose-400"
                  maxLength={280}
                />
                <div className="text-right text-xs text-rose-500">
                  {rewriteContent.length}/280 characters
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsRewriteModalOpen(false)}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRewrite}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  disabled={!rewriteContent.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Update Thread
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Swipe Interface */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-foreground font-medium">Loading profiles...</p>
            </div>
          </div>
        ) : currentIndex >= profiles.length ? (
          <div className="flex items-center justify-center min-h-[60vh] p-6">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
                <Heart className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold text-foreground">All profiles explored!</h3>
                <p className="text-muted-foreground">
                  Check back later for new profiles.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setCurrentIndex(0);
                  setSwipeCount(0);
                }}
                className="bg-gradient-primary text-primary-foreground shadow-glow"
              >
                Explore Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-sm mx-auto space-y-4">
            {/* Profile Card */}
            <Card className="overflow-hidden shadow-premium border-0 bg-card/90 backdrop-blur-sm rounded-3xl">
              <div className="relative">
                <div className="aspect-[3/4] relative overflow-hidden">
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

                  {/* Main Image */}
                  <img
                    src={currentProfile?.profile_images?.[currentImageIndex] || currentProfile?.profile_images?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'}
                    alt={`${currentProfile?.first_name}'s profile photo ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />

                  {/* Invisible tap areas for navigation */}
                  {currentProfile?.profile_images && currentProfile.profile_images.length > 1 && (
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
                  {currentProfile?.profile_images && currentProfile.profile_images.length > 1 && (
                    <div className="absolute top-16 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded-full backdrop-blur-sm z-20">
                      {currentImageIndex + 1}/{currentProfile.profile_images.length}
                    </div>
                  )}
                  
                  {/* Enhanced Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-transparent to-pink-500/20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-4 left-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                    <div className="w-6 h-6 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"></div>
                  </div>
                  
                  {/* Age Badge with Modern Design */}
                  <div className="absolute top-4 right-4 px-4 py-2 bg-card/90 backdrop-blur-md rounded-full border border-border shadow-soft">
                    <span className="text-foreground font-bold text-sm">
                      {currentProfile ? calculateAge(currentProfile.date_of_birth) : ''}
                    </span>
                  </div>
                  
                  {/* University Badge */}
                  <div className="absolute top-20 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full border border-white/30">
                    <span className="text-white text-xs font-medium flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {currentProfile?.university}
                    </span>
                  </div>
                  
                  {/* Profile Information Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-3xl font-bold mb-2 drop-shadow-lg">
                          {currentProfile?.first_name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {currentProfile?.total_qcs && (
                              <div className="px-3 py-1 bg-gradient-primary/90 rounded-full border border-white/30 backdrop-blur-sm">
                                <div className="flex items-center space-x-1">
                                  <Shield className="w-4 h-4" />
                                  <span className="text-sm font-semibold">QCS: {currentProfile.total_qcs}</span>
                                </div>
                              </div>
                            )}
                            <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Action Indicator */}
                </div>
              </div>

              <CardContent className="p-6 space-y-5 bg-gradient-to-b from-card to-muted/50">
                {currentProfile?.bio && (
                  <div className="relative">
                    <div className="absolute -top-2 left-0 w-8 h-1 bg-gradient-primary rounded-full"></div>
                    <p className="text-foreground leading-relaxed text-sm pt-3 font-medium">
                      "{currentProfile.bio}"
                    </p>
                  </div>
                )}

                {currentProfile?.interests && currentProfile.interests.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-foreground flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.slice(0, 4).map((interest, index) => (
                        <div
                          key={index}
                          className="px-3 py-1 bg-secondary text-secondary-foreground border border-border rounded-full text-xs font-medium hover:shadow-soft transition-shadow duration-300"
                        >
                          {interest}
                        </div>
                      ))}
                      {currentProfile.interests.length > 4 && (
                        <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                          +{currentProfile.interests.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Compatibility Score */}
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl border border-border">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-foreground">Compatibility</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">95%</div>
                    <div className="text-xs text-muted-foreground">Great Match!</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Action Buttons */}
            <div className="flex justify-center space-x-8 mt-8">
              <button
                onClick={() => handleSwipe('left')}
                className="group relative w-16 h-16 bg-card rounded-full flex items-center justify-center shadow-premium hover:shadow-glow transition-all duration-300 hover:scale-110 border-2 border-border"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-destructive/20 to-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <X className="w-7 h-7 text-destructive group-hover:text-destructive-foreground relative z-10 transition-colors duration-300" />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-semibold text-destructive bg-card px-2 py-1 rounded-full shadow-soft">Pass</span>
                </div>
              </button>
              
              <button
                onClick={() => handleSwipe('right')}
                className="group relative w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-premium hover:shadow-glow transition-all duration-300 hover:scale-110 border-2 border-primary-foreground/20"
              >
                <Heart className="w-8 h-8 text-primary-foreground fill-current" />
                <div className="absolute inset-0 rounded-full bg-primary-foreground/20"></div>
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-semibold text-primary bg-card px-3 py-1 rounded-full shadow-soft">Like</span>
                </div>
              </button>

              <button className="group relative w-14 h-14 bg-card rounded-full flex items-center justify-center shadow-soft hover:shadow-premium transition-all duration-300 hover:scale-110 border-2 border-border">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Star className="w-6 h-6 text-accent group-hover:text-accent-foreground relative z-10 transition-colors duration-300" />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-semibold text-accent bg-card px-2 py-1 rounded-full shadow-soft">Super</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="hidden">
        <div className="flex justify-around items-center py-2 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="flex-col h-auto py-2 px-3 text-primary hover:text-primary hover:bg-primary/10"
          >
            <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center mb-1">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('pairing')}
            className="flex-col h-auto py-2 px-3 text-foreground hover:text-primary hover:bg-primary/10"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Pairing</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('blind-date')}
            className="flex-col h-auto py-2 px-3 text-foreground hover:text-primary hover:bg-primary/10"
          >
            <Sparkles className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Blind Date</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('profile')}
            className="flex-col h-auto py-2 px-3 text-foreground hover:text-primary hover:bg-primary/10"
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('subscription')}
            className="flex-col h-auto py-2 px-3 text-foreground hover:text-primary hover:bg-primary/10"
          >
            <Crown className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Premium</span>
          </Button>
        </div>
      </div>
      {/* Who Liked Me Modal */}
      <WhoLikedMeModal 
        isOpen={showWhoLikedMe} 
        onClose={() => setShowWhoLikedMe(false)} 
      />

      {/* Who Liked Me Modal */}
      <WhoLikedMeModal 
        isOpen={showWhoLikedMe}
        onClose={() => setShowWhoLikedMe(false)}
      />
    </UnifiedLayout>
  );
};

export default DateSigmaHome;