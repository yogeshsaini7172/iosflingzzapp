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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gradient-subtle">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-glow"></div>
          <p className="text-foreground/70 font-modern text-lg">Loading premium profiles...</p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-accent rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-secondary rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6 bg-gradient-subtle">
        <div className="text-center space-y-8 max-w-md animate-elegant-entrance">
          <div className="w-32 h-32 bg-gradient-royal rounded-full flex items-center justify-center mx-auto shadow-premium animate-float">
            <Heart className="w-16 h-16 text-white animate-pulse-glow" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-elegant font-bold text-gradient-primary">All Premium Profiles Explored!</h3>
            <p className="text-foreground/70 font-modern leading-relaxed">
              You've discovered all available elite matches. New exclusive profiles are curated daily.
            </p>
          </div>
          <div className="space-y-4">
            <Badge className="bg-gradient-secondary text-black border-0 shadow-gold font-modern font-semibold px-4 py-2">
              {swipeCount} premium profiles explored today
            </Badge>
            <Button 
              onClick={() => {
                setCurrentIndex(0);
                setSwipeCount(0);
              }}
              className="bg-gradient-primary shadow-premium hover:shadow-glow transition-luxury font-modern font-semibold px-8 py-3"
            >
              Explore Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="w-full min-h-screen bg-gradient-subtle p-3 pb-20">
      {/* Mobile-Optimized Stats Header */}
      <div className="flex justify-between items-center p-3 glass-luxury rounded-2xl border-gradient shadow-soft mb-4">
        <Badge variant="outline" className="flex items-center space-x-2 border-primary/30 text-primary bg-primary/5 px-3 py-1.5">
          <Zap className="w-4 h-4 animate-pulse-glow" />
          <span className="font-modern font-semibold">{currentIndex + 1} of {profiles.length}</span>
        </Badge>
        <Badge className="bg-gradient-rose text-white border-0 shadow-royal font-modern font-semibold px-3 py-1.5">
          {20 - swipeCount} swipes left
        </Badge>
      </div>

      {/* Mobile-Optimized Profile Card */}
      <Card className="overflow-hidden shadow-premium border-gradient bg-gradient-card hover-elegant rounded-3xl">
        <div className="relative">
          {/* Profile Image with Multiple Photo Support */}
          <div className="aspect-[3/4] relative">
            {currentProfile.profile_images && currentProfile.profile_images.length > 0 ? (
              <>
                <img
                  src={currentProfile.profile_images[0]}
                  alt={`${currentProfile.first_name}'s profile`}
                  className="w-full h-full object-cover"
                />
                
                {/* Multiple Photos Indicator */}
                {currentProfile.profile_images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    1/{currentProfile.profile_images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">👤</span>
                  </div>
                  <p className="text-white/60 text-sm">No photo</p>
                </div>
              </div>
            )}
            
            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Mobile-Optimized Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white animate-slide-up">
              <div className="space-y-3">
                <div>
                  <h3 className="text-2xl font-elegant font-bold tracking-tight leading-tight">
                    {currentProfile.first_name}, {calculateAge(currentProfile.date_of_birth)}
                  </h3>
                  <div className="flex items-center space-x-2 text-white/90 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-modern text-sm">{currentProfile.university}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-accent animate-pulse-glow" />
                  {currentProfile.total_qcs && (
                    <Badge className="bg-gradient-gold text-black border-0 shadow-gold font-modern font-bold text-xs px-2 py-1">
                      QCS: {currentProfile.total_qcs}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-5 space-y-5 bg-gradient-card">
          {/* Mobile-Optimized Bio */}
          {currentProfile.bio && (
            <div className="glass-dark-luxury p-4 rounded-2xl border border-border/50">
              <h4 className="font-elegant font-semibold mb-3 text-gradient-primary text-base">About</h4>
              <p className="text-foreground/80 text-sm leading-relaxed font-modern">
                {currentProfile.bio}
              </p>
            </div>
          )}

          {/* Mobile-Optimized Interests */}
          {currentProfile.interests && currentProfile.interests.length > 0 && (
            <div>
              <h4 className="font-elegant font-semibold mb-3 text-gradient-gold text-base">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.slice(0, 6).map((interest, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs border-primary/20 bg-primary/5 hover:bg-primary/10 transition-luxury font-modern px-3 py-1.5"
                  >
                    {interest}
                  </Badge>
                ))}
                {currentProfile.interests.length > 6 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs border-primary/20 bg-primary/5 font-modern px-3 py-1.5"
                  >
                    +{currentProfile.interests.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile-Optimized Action Buttons */}
      <div className="flex justify-center space-x-4 mt-6">
        <Button
          onClick={() => handleSwipe('left')}
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full glass-luxury border-red-300/50 hover:bg-red-50 hover:border-red-400 hover:shadow-soft transition-luxury group touch-manipulation"
        >
          <X className="w-7 h-7 text-red-500 group-hover:scale-110 transition-all" />
        </Button>
        
        <Button
          onClick={() => handleSwipe('right')}
          size="lg"
          className="w-16 h-16 rounded-full bg-gradient-rose shadow-premium hover:shadow-glow transition-luxury group animate-pulse-glow touch-manipulation"
        >
          <Heart className="w-7 h-7 text-white group-hover:scale-110 transition-all" />
        </Button>
      </div>

      {/* Mobile Tips */}
      <div className="text-center text-sm text-foreground/60 font-modern mt-4 px-4">
        Tap ✗ to pass • Tap ❤️ for premium matches
      </div>
    </div>
  );
};

export default SwipeCards;