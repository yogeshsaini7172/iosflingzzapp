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
  Star,
  Shield,
  Plus,
  Crown,
  Send,
  MessageCircle,
  Bell,
  Edit,
  Trash,
  MapPin
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
import TinderProfileCard from "../dating/TinderProfileCard";

// Thread interface now comes from useThreads hook

interface FlingzzHomeProps {
  onNavigate: (view: string) => void;
}

// Threads are now loaded from database via useThreads hook

const FlingzzHome = ({ onNavigate }: FlingzzHomeProps) => {
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
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchCurrentX, setTouchCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
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

  const toggleThreadReplies = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
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

  // Utility function to show only first two words of thread content
  const getFirstTwoWords = (content: string) => {
    if (!content) return '';
    const words = content.trim().split(/\s+/);
    return words.length >= 2 ? `${words[0]} ${words[1]}` : content;
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

  const transformProfileForTinderCard = (profile: any) => {
    console.log('Transforming profile for TinderCard:', profile);
    console.log('Profile images:', profile?.profile_images);
    console.log('Current image index:', currentImageIndex);

    const transformed = {
      name: profile?.first_name || '',
      age: profile ? calculateAge(profile.date_of_birth) : '',
      location: profile?.university || '',
      distance: 'Nearby', // You can calculate actual distance if available
      weight: 'N/A', // Add if available in profile data
      height: 'N/A', // Add if available in profile data
      about: profile?.bio || '',
      interests: profile?.interests?.map((interest: string) => ({
        icon: '🎯', // Default icon, can be customized
        text: interest
      })) || [],
      image: profile?.profile_images?.[currentImageIndex] || profile?.profile_images?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face',
      isPremium: false // Set based on subscription status if available
    };

    console.log('Transformed profile for TinderCard:', transformed);
    console.log('Selected image URL:', transformed.image);

    return transformed;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth > 768) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchCurrentX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || window.innerWidth > 768) return;
    e.preventDefault();
    setTouchCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping || window.innerWidth > 768) return;
    const deltaX = touchCurrentX - touchStartX;
    const threshold = 100;
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    }
    setIsSwiping(false);
    setTouchStartX(0);
    setTouchCurrentX(0);
  };


  return (
    <UnifiedLayout title="FLINGZZ Home" showHeader={false}>
      {/* Custom Header for Home */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-sm">FZ</span>
            </div>
            <h1 className="text-base font-display font-bold text-foreground">FLINGZZ</h1>
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
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50 px-6 py-4 sm:px-4">
        <div className="flex items-center justify-center mb-4">
          <h2 className="text-lg font-display font-bold text-foreground">Community Threads</h2>
        </div>
        <div className="flex flex-row space-x-4 h-64 overflow-x-auto">
          {/* Add Today's Thread Option OR User's Thread Management */}
          {(() => {
            const userThreads = threads.filter(t => t.user_id === (user?.uid || ''));

            if (userThreads.length === 0) {
              // Show "Add Today's Thread" if user has no threads
              return (
                <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
                  <DialogTrigger asChild>
                    <Card className="w-full h-80 flex-shrink-0 p-4 bg-gradient-primary text-primary-foreground border-0 rounded-lg shadow-lg cursor-pointer hover:shadow-glow transition-all">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Plus className="w-5 h-5" />
                        <span className="font-semibold text-sm">Share Your Thoughts</span>
                      </div>
                      <p className="text-xs text-primary-foreground/90 text-center">What's on your mind today?</p>
                    </Card>
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
              // Show user's thread management options AND post new thread option
              const latestUserThread = userThreads[0];
              const threadAuthor = latestUserThread.author?.first_name || 'You';
              return (
                <>


                  {/* Existing Thread Management */}
                  <Card className="w-full h-48 flex-shrink-0 p-4 bg-gradient-secondary text-secondary-foreground border-0 rounded-full shadow-lg overflow-hidden">
                    <div className="space-y-2 h-full flex flex-col justify-center items-center">
                      <div className="text-center flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <User className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="font-semibold text-sm sm:text-base">Your Latest Thread</span>
                        </div>
                        <p className="text-xs sm:text-sm text-secondary-foreground/90 leading-relaxed break-words text-center px-2">
                          {getFirstTwoWords(latestUserThread.content)}...
                        </p>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-secondary-foreground hover:bg-secondary-foreground/20"
                          onClick={() => handleRewriteThread(latestUserThread)}
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-secondary-foreground hover:bg-destructive/20"
                          onClick={() => handleDeleteThread(latestUserThread.id)}
                          title="Delete"
                        >
                          <Trash className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </>
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
            const isExpanded = expandedThreads.has(thread.id);
            const hasReplies = thread.replies && thread.replies.length > 0;

            return (
              <Card key={thread.id} className="w-full h-80 flex-shrink-0 p-4 bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card transition-colors rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-3">
                  <Avatar className="w-12 h-12 sm:w-10 sm:h-10 mx-auto sm:mx-0">
                    <AvatarImage src={threadAvatar} alt={threadAuthor} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                      {threadAuthor.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                      <span className="font-semibold text-base text-foreground flex items-center justify-center sm:justify-start">
                        {threadAuthor}
                        {isOwnThread && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3">{getFirstTwoWords(thread.content)}...</p>
                  </div>
                </div>

                {/* Show replies only when expanded */}
                {isExpanded && hasReplies && (
                  <div className="mb-3 space-y-2 max-h-40 overflow-y-auto border-l-2 border-primary/20 pl-3">
                    <div className="text-xs text-muted-foreground mb-2 italic">
                      Replying to: "{getFirstTwoWords(thread.content)}..."
                    </div>
                    {thread.replies.map((reply: any) => {
                      const replyAuthor = reply.author?.first_name || 'Anonymous';
                      const replyAvatar = reply.author?.profile_images?.[0];
                      return (
                        <div key={reply.id} className="flex space-x-2 p-2 bg-muted/50 rounded-md border-l-2 border-accent">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={replyAvatar} alt={replyAuthor} />
                            <AvatarFallback className="bg-muted-foreground text-muted text-xs">
                              {replyAuthor.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-foreground">{replyAuthor}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-foreground mt-1 break-words">{reply.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

<div className="flex items-center justify-between text-xs">
  <div className="flex space-x-4 sm:space-x-6">
    <button
      className={`flex items-center space-x-1 hover:text-primary transition-colors ${
        isLiked ? 'text-primary' : 'text-muted-foreground'
      }`}
      onClick={() => handleLikeThread(thread.id)}
    >
      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
      <span className="hidden sm:inline">{thread.likes_count}</span>
    </button>

    {hasReplies && (
      <button
        className={`flex items-center space-x-1 transition-colors ${
          isExpanded ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        }`}
        onClick={() => toggleThreadReplies(thread.id)}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'View'} Replies</span>
      </button>
    )}

                    <button
                      className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => handleReplyToThread(thread)}
                    >
                      <MessageCircle className="w-4 h-4" style={{ marginLeft: '61px' }} />
                      <span className="hidden sm:inline">Reply</span>
                    </button>
                  </div>
                  <span className="text-muted-foreground hidden sm:inline">{thread.replies?.length || 0} replies</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Reply Modal */}
        <Dialog open={isReplyModalOpen} onOpenChange={setIsReplyModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-rose-700">Reply to {selectedThreadForReply?.author?.first_name || 'Anonymous'}</DialogTitle>
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
        ) : currentProfile ? (
          <div className="flex justify-center px-4 py-8">
            {/* Complete Swipe Card Template Remake */}
            <div className="relative w-full max-w-sm">
              <Card className="w-full h-[620px] rounded-3xl overflow-hidden shadow-2xl border-0 bg-white relative">
                
                {/* Main Photo Section - 65% */}
                <div className="relative h-[65%] bg-gray-100">
                  {currentProfile?.profile_images?.length > 0 ? (
                    <>
                      <img
                        src={currentProfile.profile_images[currentImageIndex]}
                        alt={`${currentProfile.first_name}'s profile`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face';
                        }}
                      />
                      
                      {/* Image Indicators */}
                      {currentProfile.profile_images.length > 1 && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                          {currentProfile.profile_images.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                index === currentImageIndex 
                                  ? 'bg-white shadow-lg' 
                                  : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Navigation Areas */}
                      <div 
                        className="absolute left-0 top-0 w-1/2 h-full cursor-pointer"
                        onClick={() => handleImageNavigation('prev')}
                      />
                      <div 
                        className="absolute right-0 top-0 w-1/2 h-full cursor-pointer"
                        onClick={() => handleImageNavigation('next')}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-3xl font-bold mb-2">FILNGZZ</div>
                        <div className="text-sm opacity-80">SLOGAN HERE</div>
                      </div>
                    </div>
                  )}

                  {/* Premium Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-xs shadow-md">
                      PREMIUM
                    </div>
                  </div>
                </div>

                {/* Profile Details Section - 25% */}
                <div className="h-[25%] bg-white px-6 py-4 flex flex-col justify-center">
                  <div className="space-y-3">
                    {/* Name, Age & QCS Score */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">
                          {currentProfile.first_name}, {calculateAge(currentProfile.date_of_birth)}
                        </h2>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-red-500">
                          {currentProfile.total_qcs || 3333}
                        </div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          QCS
                        </div>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {currentProfile.university || 'IIT'}
                      </span>
                    </div>
                    
                    {/* Interest Tag */}
                    {currentProfile.interests?.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium border-0 inline-block">
                          {currentProfile.interests[0]}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Swipe Up Indicator - 10% */}
                <div className="h-[10%] bg-white border-t border-gray-100 flex items-center justify-center">
                  <div className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">
                    👆 Swipe up for more
                  </div>
                </div>
              </Card>

              {/* Floating Heart Button */}
              <div className="absolute bottom-4 right-4 z-10">
                <button
                  onClick={() => handleSwipe('right')}
                  className="w-14 h-14 bg-pink-500 hover:bg-pink-600 rounded-full shadow-2xl flex items-center justify-center border-4 border-white transition-all duration-200 hover:scale-110"
                >
                  <Heart className="w-6 h-6 text-white" fill="currentColor" />
                </button>
              </div>

              {/* Hidden Reject Button for Touch Gestures */}
              <div className="absolute bottom-4 left-4 z-10 opacity-0">
                <button
                  onClick={() => handleSwipe('left')}
                  className="w-12 h-12 bg-gray-400 rounded-full shadow-lg flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>
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
    </UnifiedLayout>
  );
};

export default FlingzzHome;