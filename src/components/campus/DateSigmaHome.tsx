import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Crown
} from "lucide-react";
import { useProfilesFeed } from '@/hooks/useProfilesFeed';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DateSigmaHomeProps {
  onNavigate: (view: string) => void;
}

// Mock threads data
const mockThreads = [
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
  const { toast } = useToast();

  const getCurrentUserId = () => {
    // Bypass auth - use default user ID for database operations
    return '11111111-1111-1111-1111-111111111001'; // Default Alice user
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
      {/* Threads Section */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-rose-200/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-rose-700">Threads</h2>
        </div>
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
          {/* Add Today's Thread Option */}
          <div className="flex-shrink-0 w-64">
            <Card className="p-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white border-0 hover:from-rose-500 hover:to-pink-600 transition-colors cursor-pointer">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Plus className="w-5 h-5" />
                <span className="font-semibold text-sm">Add Today's Thread</span>
              </div>
              <p className="text-xs text-white/90 text-center">Share what's on your mind today</p>
            </Card>
          </div>

          {/* Thread Cards - Horizontal */}
          {mockThreads.map((thread) => (
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
                      <span className="font-semibold text-sm text-rose-700 truncate">{thread.author}</span>
                      <span className="text-xs text-rose-400 flex-shrink-0">{thread.time}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-rose-600 leading-relaxed mb-3 line-clamp-3">{thread.content}</p>
                <div className="flex items-center justify-between text-xs text-rose-400">
                  <button className="flex items-center space-x-1 hover:text-rose-600 transition-colors">
                    <Heart className="w-3 h-3" />
                    <span>{thread.likes}</span>
                  </button>
                  <button className="hover:text-rose-600 transition-colors">
                    {thread.replies} replies
                  </button>
                </div>
              </Card>
            </div>
          ))}
        </div>
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