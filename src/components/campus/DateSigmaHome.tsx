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
  Plus
} from "lucide-react";
import { useProfilesFeed } from '@/hooks/useProfilesFeed';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DateSigmaHomeProps {
  onNavigate: (view: string) => void;
}

// Mock threads/stories data - replace with real data
const mockStories = [
  { id: 1, name: "Your Story", image: "/placeholder.svg", isOwn: true },
  { id: 2, name: "Sarah", image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150" },
  { id: 3, name: "Alex", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { id: 4, name: "Maria", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
  { id: 5, name: "Jake", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
];

const DateSigmaHome = ({ onNavigate }: DateSigmaHomeProps) => {
  const { profiles, loading } = useProfilesFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const { toast } = useToast();

  const getCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id || null;
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

    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue swiping",
        variant: "destructive"
      });
      return;
    }

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
    <div className="min-h-screen bg-gradient-soft pb-20">
      {/* Stories/Threads Section */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {mockStories.map((story) => (
            <div key={story.id} className="flex flex-col items-center space-y-2 min-w-[60px]">
              <div className={`relative ${story.isOwn ? 'ring-2 ring-primary ring-offset-2' : 'ring-2 ring-gray-300'} rounded-full p-1`}>
                <Avatar className="w-12 h-12">
                  <AvatarImage src={story.image} alt={story.name} />
                  <AvatarFallback>{story.name[0]}</AvatarFallback>
                </Avatar>
                {story.isOwn && (
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs text-center text-foreground/70 max-w-[60px] truncate">
                {story.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Swipe Interface */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-foreground/70">Loading profiles...</p>
            </div>
          </div>
        ) : currentIndex >= profiles.length ? (
          <div className="flex items-center justify-center min-h-[60vh] p-6">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">All profiles explored!</h3>
                <p className="text-foreground/70">
                  Check back later for new profiles.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setCurrentIndex(0);
                  setSwipeCount(0);
                }}
                className="bg-gradient-primary"
              >
                Explore Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-sm mx-auto space-y-4">
            {/* Profile Card */}
            <Card className="overflow-hidden shadow-lg">
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
                        <h3 className="text-2xl font-bold">
                          {currentProfile?.first_name}, {currentProfile ? calculateAge(currentProfile.date_of_birth) : ''}
                        </h3>
                        <div className="flex items-center space-x-1 text-white/90 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{currentProfile?.university}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-accent" />
                        {currentProfile?.total_qcs && (
                          <Badge className="bg-accent text-accent-foreground">
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
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {currentProfile.bio}
                    </p>
                  </div>
                )}

                {currentProfile?.interests && currentProfile.interests.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.slice(0, 4).map((interest, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs"
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
                className="w-16 h-16 rounded-full border-red-300 hover:bg-red-50 hover:border-red-400"
              >
                <X className="w-6 h-6 text-red-500" />
              </Button>
              
              <Button
                onClick={() => handleSwipe('right')}
                size="lg"
                className="w-16 h-16 rounded-full bg-gradient-primary"
              >
                <Heart className="w-6 h-6 text-white" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
        <div className="flex justify-around items-center py-2 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="flex-col h-auto py-2 px-3"
          >
            <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center mb-1">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('pairing')}
            className="flex-col h-auto py-2 px-3"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Pairing</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('blind-date')}
            className="flex-col h-auto py-2 px-3"
          >
            <Sparkles className="w-6 h-6 mb-1" />
            <span className="text-xs">Blind Date</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('profile')}
            className="flex-col h-auto py-2 px-3"
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateSigmaHome;