import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface Thread {
  id: number;
  author: string;
  content: string;
  time: string;
  likes: number;
  replies: number;
  avatar: string;
  userId?: string;
}

interface DateSigmaHomeProps {
  onNavigate: (view: string) => void;
}

// Initial threads data
const initialThreads: Thread[] = [
  { 
    id: 1, 
    author: "Sarah K", 
    content: "Just had the most amazing coffee date! Sometimes the best connections happen when you least expect them ☕️💕", 
    time: "2m ago",
    likes: 24,
    replies: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
  },
  { 
    id: 2, 
    author: "Alex M", 
    content: "Pro tip: Don't overthink your bio. Just be yourself and let your personality shine through! 🌟", 
    time: "15m ago",
    likes: 18,
    replies: 3,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
  },
  { 
    id: 3, 
    author: "Maria L", 
    content: "Found my study buddy turned something more 📚❤️ College romance is real!", 
    time: "1h ago",
    likes: 42,
    replies: 12,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
  }
];

const DateSigmaHome = ({ onNavigate }: DateSigmaHomeProps) => {
  const { profiles, loading } = useProfilesFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [threads, setThreads] = useState<Thread[]>(() => {
    const savedThreads = localStorage.getItem('userThreads');
    return savedThreads ? JSON.parse(savedThreads) : initialThreads;
  });
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isRewriteModalOpen, setIsRewriteModalOpen] = useState(false);
  const [newThreadContent, setNewThreadContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [rewriteContent, setRewriteContent] = useState('');
  const [selectedThreadForReply, setSelectedThreadForReply] = useState<Thread | null>(null);
  const [selectedThreadForRewrite, setSelectedThreadForRewrite] = useState<Thread | null>(null);
  const [likedThreads, setLikedThreads] = useState<Set<number>>(() => {
    const savedLikes = localStorage.getItem('likedThreads');
    return savedLikes ? new Set(JSON.parse(savedLikes)) : new Set();
  });
  const { toast } = useToast();

  // Save threads to localStorage whenever threads change
  useEffect(() => {
    localStorage.setItem('userThreads', JSON.stringify(threads));
  }, [threads]);

  // Save liked threads to localStorage whenever likes change
  useEffect(() => {
    localStorage.setItem('likedThreads', JSON.stringify(Array.from(likedThreads)));
  }, [likedThreads]);

  const getCurrentUserId = () => {
    // Bypass auth - use default user ID for database operations
    return '11111111-1111-1111-1111-111111111001'; // Default Alice user
  };

  const getCurrentUserProfile = () => {
    return {
      name: 'You',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
    };
  };

  const handlePostThread = () => {
    if (!newThreadContent.trim()) {
      toast({
        title: "Error",
        description: "Please write something to share!",
        variant: "destructive"
      });
      return;
    }

    const userProfile = getCurrentUserProfile();
    const newThread: Thread = {
      id: Date.now(), // Simple ID generation
      author: userProfile.name,
      content: newThreadContent.trim(),
      time: "now",
      likes: 0,
      replies: 0,
      avatar: userProfile.avatar,
      userId: getCurrentUserId()
    };

    setThreads(prevThreads => [newThread, ...prevThreads]);
    setNewThreadContent('');
    setIsPostModalOpen(false);
    
    toast({
      title: "Thread posted! 🎉",
      description: "Your thread has been shared with the community.",
    });
  };

  const handleLikeThread = (threadId: number) => {
    const newLikedThreads = new Set(likedThreads);
    const isCurrentlyLiked = likedThreads.has(threadId);
    
    if (isCurrentlyLiked) {
      newLikedThreads.delete(threadId);
    } else {
      newLikedThreads.add(threadId);
    }
    
    setLikedThreads(newLikedThreads);
    
    // Update the thread's like count
    setThreads(prevThreads => 
      prevThreads.map(thread => 
        thread.id === threadId 
          ? { ...thread, likes: thread.likes + (isCurrentlyLiked ? -1 : 1) }
          : thread
      )
    );

    if (!isCurrentlyLiked) {
      toast({
        title: "Liked! ❤️",
        description: "You liked this thread.",
      });
    }
  };

  const handleReplyToThread = (thread: Thread) => {
    setSelectedThreadForReply(thread);
    setIsReplyModalOpen(true);
    setReplyContent('');
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !selectedThreadForReply) {
      toast({
        title: "Error",
        description: "Please write a reply!",
        variant: "destructive"
      });
      return;
    }

    // Update the thread's reply count
    setThreads(prevThreads => 
      prevThreads.map(thread => 
        thread.id === selectedThreadForReply.id 
          ? { ...thread, replies: thread.replies + 1 }
          : thread
      )
    );

    setIsReplyModalOpen(false);
    setReplyContent('');
    setSelectedThreadForReply(null);
    
    toast({
      title: "Reply posted! 💬",
      description: `Your reply to ${selectedThreadForReply.author} has been added.`,
    });
  };

  const handleRewriteThread = (thread: Thread) => {
    setSelectedThreadForRewrite(thread);
    setRewriteContent(thread.content);
    setIsRewriteModalOpen(true);
  };

  const handleSubmitRewrite = () => {
    if (!rewriteContent.trim() || !selectedThreadForRewrite) {
      toast({
        title: "Error",
        description: "Please write something to update your thread!",
        variant: "destructive"
      });
      return;
    }

    setThreads(prevThreads => 
      prevThreads.map(thread => 
        thread.id === selectedThreadForRewrite.id 
          ? { ...thread, content: rewriteContent.trim(), time: "edited now" }
          : thread
      )
    );

    setIsRewriteModalOpen(false);
    setRewriteContent('');
    setSelectedThreadForRewrite(null);
    
    toast({
      title: "Thread updated! ✏️",
      description: "Your thread has been rewritten successfully.",
    });
  };

  const handleDeleteThread = (threadId: number) => {
    setThreads(prevThreads => prevThreads.filter(thread => thread.id !== threadId));
    
    // Also remove from liked threads if it was liked
    const newLikedThreads = new Set(likedThreads);
    newLikedThreads.delete(threadId);
    setLikedThreads(newLikedThreads);
    
    toast({
      title: "Thread deleted! 🗑️",
      description: "Your thread has been removed.",
    });
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
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    const userId = getCurrentUserId();

    try {
      // Record swipe in database
      const { error } = await supabase.functions.invoke('swipe-action', {
        body: {
          user_id: userId,
          candidate_id: currentProfile.user_id,
          direction: direction
        }
      });

      if (error) {
        console.error('Swipe error:', error);
      }

      // Update UI
      setCurrentIndex(prev => prev + 1);
      setSwipeCount(prev => prev + 1);

      // Show toast for matches
      if (direction === 'right') {
        // Simulate match probability
        if (Math.random() > 0.7) {
          toast({
            title: "It's a Match! 💕",
            description: `You and ${currentProfile.first_name} liked each other!`,
          });
        } else {
          toast({
            title: "Like sent! ❤️",
            description: `Your like was sent to ${currentProfile.first_name}`,
          });
        }
      }

    } catch (error) {
      console.error('Error handling swipe:', error);
      setCurrentIndex(prev => prev + 1);
      setSwipeCount(prev => prev + 1);
    }
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 pb-20">
      {/* Company Header & Chat Section */}
      <div className="bg-white/80 backdrop-blur-md border-b border-rose-100/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-rose-400 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">DS</span>
            </div>
            <h1 className="text-base font-display font-bold text-rose-700">DateSigma</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ChatNotificationBadge 
              onClick={() => onNavigate('chat')}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2"
            >
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Threads Section */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-rose-200/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-rose-700">Threads</h2>
        </div>
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
          {/* Add Today's Thread Option OR User's Thread Management */}
          {(() => {
            const userThreads = threads.filter(t => t.userId === getCurrentUserId());
            
            if (userThreads.length === 0) {
              // Show "Add Today's Thread" if user has no threads
              return (
                <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
                  <DialogTrigger asChild>
                    <div className="flex-shrink-0 w-64">
                      <Card className="p-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white border-0 hover:from-rose-500 hover:to-pink-600 transition-colors cursor-pointer">
                        <div className="flex items-center justify-center space-x-2 mb-3">
                          <Plus className="w-5 h-5" />
                          <span className="font-semibold text-sm">Add Today's Thread</span>
                        </div>
                        <p className="text-xs text-white/90 text-center">Share what's on your mind today</p>
                      </Card>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-rose-700">Share Your Thoughts</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="thread-content">What's on your mind?</Label>
                        <Textarea
                          id="thread-content"
                          placeholder="Share your thoughts, experiences, or advice with the community..."
                          value={newThreadContent}
                          onChange={(e) => setNewThreadContent(e.target.value)}
                          className="min-h-[100px] border-rose-200 focus:border-rose-400"
                          maxLength={280}
                        />
                        <div className="text-right text-xs text-rose-500">
                          {newThreadContent.length}/280 characters
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsPostModalOpen(false)}
                          className="border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handlePostThread}
                          className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600"
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
              return (
                <div className="flex-shrink-0 w-64">
                  <Card className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <User className="w-4 h-4" />
                          <span className="font-semibold text-sm">Your Thread</span>
                        </div>
                        <p className="text-xs text-white/90 line-clamp-2">{latestUserThread.content}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="flex-1 text-white hover:bg-white/20 border border-white/30"
                          onClick={() => handleRewriteThread(latestUserThread)}
                        >
                          <span className="text-xs">Rewrite</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="flex-1 text-white hover:bg-red-500/50 border border-white/30"
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
            const isOwnThread = thread.userId === getCurrentUserId();
            
            return (
              <div key={thread.id} className="flex-shrink-0 w-72">
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-rose-200/50 hover:bg-white/90 transition-colors h-full">
                  <div className="flex space-x-3 mb-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={thread.avatar} alt={thread.author} />
                      <AvatarFallback className="bg-rose-100 text-rose-600 text-xs font-semibold">
                        {thread.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm text-rose-700 truncate flex items-center">
                          {thread.author}
                          {isOwnThread && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-rose-100 text-rose-600">
                              You
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-rose-400 flex-shrink-0">{thread.time}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-rose-600 leading-relaxed mb-3 line-clamp-3">{thread.content}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex space-x-3">
                      <button 
                        className={`flex items-center space-x-1 hover:text-rose-600 transition-colors ${
                          isLiked ? 'text-red-500' : 'text-rose-400'
                        }`}
                        onClick={() => handleLikeThread(thread.id)}
                      >
                        <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{thread.likes}</span>
                      </button>
                      
                      {!isOwnThread && (
                        <button 
                          className="flex items-center space-x-1 text-rose-400 hover:text-rose-600 transition-colors"
                          onClick={() => handleReplyToThread(thread)}
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      )}
                    </div>
                    <span className="text-rose-400">{thread.replies} replies</span>
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
              <div className="w-16 h-16 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-rose-600 font-medium">Loading profiles...</p>
            </div>
          </div>
        ) : currentIndex >= profiles.length ? (
          <div className="flex items-center justify-center min-h-[60vh] p-6">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold text-rose-700">All profiles explored!</h3>
                <p className="text-rose-500">
                  Check back later for new profiles.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setCurrentIndex(0);
                  setSwipeCount(0);
                }}
                className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white shadow-lg"
              >
                Explore Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-sm mx-auto space-y-4">
            {/* Profile Card */}
            <Card className="overflow-hidden shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl">
              <div className="relative">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={currentProfile?.profile_images?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'}
                    alt={`${currentProfile?.first_name}'s profile`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  
                  {/* Enhanced Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-transparent to-pink-500/20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-4 left-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                    <div className="w-6 h-6 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Age Badge with Modern Design */}
                  <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-white/50 shadow-lg">
                    <span className="text-rose-600 font-bold text-sm">
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
                              <div className="px-3 py-1 bg-gradient-to-r from-rose-500/90 to-pink-500/90 rounded-full border border-white/30 backdrop-blur-sm">
                                <div className="flex items-center space-x-1">
                                  <Shield className="w-4 h-4" />
                                  <span className="text-sm font-semibold">QCS: {currentProfile.total_qcs}</span>
                                </div>
                              </div>
                            )}
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Action Indicator */}
                  <div className="absolute bottom-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 animate-bounce">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-5 bg-gradient-to-b from-white to-rose-50/50">
                {currentProfile?.bio && (
                  <div className="relative">
                    <div className="absolute -top-2 left-0 w-8 h-1 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"></div>
                    <p className="text-rose-700 leading-relaxed text-sm pt-3 font-medium">
                      "{currentProfile.bio}"
                    </p>
                  </div>
                )}

                {currentProfile?.interests && currentProfile.interests.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-rose-700 flex items-center">
                      <div className="w-2 h-2 bg-rose-400 rounded-full mr-2"></div>
                      Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.slice(0, 4).map((interest, index) => (
                        <div
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 border border-rose-200 rounded-full text-xs font-medium hover:shadow-md transition-shadow duration-300"
                        >
                          {interest}
                        </div>
                      ))}
                      {currentProfile.interests.length > 4 && (
                        <div className="px-3 py-1 bg-rose-500 text-white rounded-full text-xs font-bold">
                          +{currentProfile.interests.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Compatibility Score */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-200/50">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-rose-700">Compatibility</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-rose-600">95%</div>
                    <div className="text-xs text-rose-400">Great Match!</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Action Buttons */}
            <div className="flex justify-center space-x-8 mt-8">
              <button
                onClick={() => handleSwipe('left')}
                className="group relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-red-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <X className="w-7 h-7 text-red-500 group-hover:text-white relative z-10 transition-colors duration-300" />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-semibold text-red-500 bg-white px-2 py-1 rounded-full shadow-lg">Pass</span>
                </div>
              </button>
              
              <button
                onClick={() => handleSwipe('right')}
                className="group relative w-20 h-20 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl hover:shadow-rose-500/25 transition-all duration-300 hover:scale-110 border-2 border-white"
              >
                <Heart className="w-8 h-8 text-white fill-current animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-semibold text-rose-600 bg-white px-3 py-1 rounded-full shadow-lg">Like</span>
                </div>
              </button>

              <button className="group relative w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-yellow-100">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Star className="w-6 h-6 text-yellow-500 group-hover:text-white relative z-10 transition-colors duration-300" />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-semibold text-yellow-600 bg-white px-2 py-1 rounded-full shadow-lg">Super</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-rose-200/50 z-50 shadow-lg">
        <div className="flex justify-around items-center py-2 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <div className="w-6 h-6 bg-gradient-to-r from-rose-400 to-pink-500 rounded-lg flex items-center justify-center mb-1">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('pairing')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Pairing</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('blind-date')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Sparkles className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Blind Date</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('profile')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('subscription')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Crown className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Premium</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateSigmaHome;