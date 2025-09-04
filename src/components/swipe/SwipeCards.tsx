import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, X, MapPin, Star, Shield, Zap } from 'lucide-react';
import { useProfilesFeed, FeedProfile } from '@/hooks/useProfilesFeed';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SwipeCards: React.FC = () => {
  const { profiles, loading } = useProfilesFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const { toast } = useToast();

  const getCurrentUserId = () => {
    return localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-purple-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">No More Profiles!</h3>
            <p className="text-muted-foreground">You've seen all available profiles. Check back later for new matches!</p>
          </div>
          <div className="space-y-2">
            <Badge className="bg-green-100 text-green-700">
              {swipeCount} profiles swiped today
            </Badge>
          </div>
          <Button 
            onClick={() => {
              setCurrentIndex(0);
              setSwipeCount(0);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Stats Header */}
      <div className="flex justify-between items-center">
        <Badge variant="outline" className="flex items-center space-x-1">
          <Zap className="w-3 h-3" />
          <span>{currentIndex + 1} of {profiles.length}</span>
        </Badge>
        <Badge className="bg-red-100 text-red-700">
          {20 - swipeCount} swipes left
        </Badge>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden shadow-xl">
        <div className="relative">
          {/* Profile Image */}
          <div className="aspect-[3/4] relative">
            <img
              src={currentProfile.profile_images?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'}
              alt={`${currentProfile.first_name}'s profile`}
              className="w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            
            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center space-x-3 mb-3">
                <div>
                  <h3 className="text-2xl font-bold">
                    {currentProfile.first_name}, {calculateAge(currentProfile.date_of_birth)}
                  </h3>
                  <div className="flex items-center space-x-1 text-white/90">
                    <MapPin className="w-4 h-4" />
                    <span>{currentProfile.university}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4 text-blue-400" />
                  {currentProfile.total_qcs && (
                    <Badge className="bg-white/20 text-white border-white/30">
                      QCS: {currentProfile.total_qcs}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Bio */}
          {currentProfile.bio && (
            <div>
              <h4 className="font-semibold mb-2">About</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentProfile.bio}
              </p>
            </div>
          )}

          {/* Interests */}
          {currentProfile.interests && currentProfile.interests.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.slice(0, 6).map((interest, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => handleSwipe('left')}
          variant="outline"
          size="lg"
          className="flex-1 h-14 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <X className="w-6 h-6 text-red-500" />
        </Button>
        
        <Button
          onClick={() => handleSwipe('right')}
          size="lg"
          className="flex-1 h-14 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
        >
          <Heart className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* Tips */}
      <div className="text-center text-xs text-muted-foreground">
        Swipe left to pass • Swipe right to like
      </div>
    </div>
  );
};

export default SwipeCards;