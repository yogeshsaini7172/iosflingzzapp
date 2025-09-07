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
          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {mockThreads.map((thread) => (
            <Card key={thread.id} className="p-3 bg-white/80 backdrop-blur-sm border-rose-200/50 hover:bg-white/90 transition-colors">
              <div className="flex space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={thread.avatar} alt={thread.author} />
                  <AvatarFallback className="bg-rose-100 text-rose-600 text-sm font-semibold">
                    {thread.author.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-rose-700">{thread.author}</span>
                    <span className="text-xs text-rose-400">{thread.time}</span>
                  </div>
                  <p className="text-sm text-rose-600 leading-relaxed">{thread.content}</p>
                  <div className="flex items-center space-x-4 text-xs text-rose-400">
                    <button className="flex items-center space-x-1 hover:text-rose-600 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{thread.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-rose-600 transition-colors">
                      <span>{thread.replies} replies</span>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
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
            <Card className="overflow-hidden shadow-lg border border-rose-200/50 bg-white/80 backdrop-blur-sm">
              <div className="relative">
                <div className="aspect-[3/4] relative">
                  <img
                    src={currentProfile?.profile_images?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'}
                    alt={`${currentProfile?.first_name}'s profile`}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-display font-bold">
                          {currentProfile?.first_name}, {currentProfile ? calculateAge(currentProfile.date_of_birth) : ''}
                        </h3>
                        <div className="flex items-center space-x-1 text-white/90 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{currentProfile?.university}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-rose-300" />
                        {currentProfile?.total_qcs && (
                          <Badge className="bg-rose-500/90 text-white border-0">
                            QCS: {currentProfile.total_qcs}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-4 space-y-4">
                {currentProfile?.bio && (
                  <div>
                    <p className="text-sm text-rose-700 leading-relaxed">
                      {currentProfile.bio}
                    </p>
                  </div>
                )}

                {currentProfile?.interests && currentProfile.interests.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-rose-700">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.slice(0, 4).map((interest, index) => (
                        <Badge 
                          key={index} 
                          className="text-xs bg-rose-100 text-rose-600 border-rose-200 hover:bg-rose-200"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-6">
              <Button
                onClick={() => handleSwipe('left')}
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full border-red-300 hover:bg-red-50 hover:border-red-400 bg-white/80"
              >
                <X className="w-6 h-6 text-red-500" />
              </Button>
              
              <Button
                onClick={() => handleSwipe('right')}
                size="lg"
                className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 shadow-lg"
              >
                <Heart className="w-6 h-6 text-white" />
              </Button>
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