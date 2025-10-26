import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, Crown, Zap } from 'lucide-react';
import Loader from '@/components/ui/Loader';

interface SwipeManagerProps {
  onUpgrade?: () => void;
}

interface SwipeCandidate {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  profile_images?: string[];
  age?: number;
  university: string;
  interests?: string[];
  verification_status: string;
}

const SwipeManager = ({ onUpgrade }: SwipeManagerProps) => {
  const [candidates, setCandidates] = useState<SwipeCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipesLeft, setSwipesLeft] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const currentCandidate = candidates[currentIndex];

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const response = await fetchWithFirebaseAuth('/functions/v1/data-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_profile' })
      });

      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();

      if (data.success && data.data.profile) {
        const profile = data.data.profile;
        setSwipesLeft(profile.swipes_left || 0);
        setSubscriptionTier(profile.subscription_tier || 'free');
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCandidates = async () => {
    if (!user) return;

    try {
      // Get feed from data-management function
      const response = await fetchWithFirebaseAuth('/functions/v1/data-management', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'get_feed',
          limit: 20
        })
      });

      if (!response.ok) throw new Error('Failed to fetch candidates');
      const data = await response.json();

      if (data.success && data.data.profiles) {
        // Calculate age for each candidate
        const candidatesWithAge = data.data.profiles.map((candidate: any) => ({
          ...candidate,
          age: candidate.date_of_birth ? 
            new Date().getFullYear() - new Date(candidate.date_of_birth).getFullYear() : 
            undefined
        }));

        setCandidates(candidatesWithAge);
      } else {
        setCandidates([]);
      }
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Error loading profiles",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || !currentCandidate) return;

    // Check swipe limits for free users
    if (subscriptionTier === 'free' && swipesLeft <= 0) {
      toast({
        title: "Daily limit reached! 🚫",
        description: "Upgrade to Premium for unlimited swipes",
        variant: "default"
      });
      return;
    }

    try {
      // Call the NEW enhanced-swipe-action function for ALL swipes (no auth required)
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/enhanced-swipe-action', {
        method: 'POST',
        body: JSON.stringify({
          target_user_id: currentCandidate.user_id,
          direction,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Enhanced swipe error:', errorData);
        throw new Error(errorData?.error || 'Failed to swipe');
      }

      const data = await response.json();

      // Update swipes left for free users
      if (subscriptionTier === 'free') {
        const updateResponse = await fetchWithFirebaseAuth('/functions/v1/data-management', {
          method: 'POST',
          body: JSON.stringify({
            action: 'update_profile',
            profile: { swipes_left: swipesLeft - 1 }
          })
        });

        if (!updateResponse.ok) throw new Error('Failed to update swipes');
        setSwipesLeft(prev => prev - 1);
      }

      // Handle the response
      if (data?.matched) {
        toast({
          title: "🎉 It's a Match!",
          description: `You and ${currentCandidate.first_name} liked each other!`,
          duration: 5000,
        });
      } else if (direction === 'right') {
        toast({
          title: "Nice choice! 💖",
          description: "We'll let you know if they like you back"
        });
      } else {
        toast({
          title: "Passed",
          description: `You passed on ${currentCandidate.first_name}`
        });
      }

      // Move to next candidate
      setCurrentIndex(prev => prev + 1);

    } catch (error: any) {
      console.error('Error handling swipe:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchCandidates();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size={32} />
      </div>
    );
  }

  if (!currentCandidate) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No more profiles! 🎯</h3>
        <p className="text-muted-foreground mb-4">
          Check back later for more potential matches
        </p>
        <Button onClick={fetchCandidates} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* Swipes Counter */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {subscriptionTier === 'free' ? (
            <span>Swipes left: <strong>{swipesLeft}</strong></span>
          ) : (
            <Badge className="bg-gradient-to-r from-primary to-accent text-white">
              <Crown className="w-3 h-3 mr-1" />
              Unlimited
            </Badge>
          )}
        </div>
        {subscriptionTier === 'free' && swipesLeft <= 3 && (
          <Button 
            size="sm" 
            onClick={onUpgrade}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Zap className="w-3 h-3 mr-1" />
            Upgrade
          </Button>
        )}
      </div>

      {/* Tinder-Style Profile Card */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-900 rounded-2xl max-w-sm mx-auto">
        {/* Card padding wrapper */}
        <div className="p-3">
          {/* Profile Image Container with rounded corners */}
          <div className="relative overflow-hidden rounded-2xl">
            <div className="aspect-[3/4] bg-gradient-subtle">
              {currentCandidate.profile_images?.[0] ? (
                <img
                  src={currentCandidate.profile_images[0]}
                  alt={currentCandidate.first_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-primary">
                        {currentCandidate.first_name[0]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">No photo</p>
                  </div>
                </div>
              )}
              
              {/* Verification Badge */}
              {currentCandidate.verification_status === 'verified' && (
                <Badge className="absolute top-4 right-4 bg-success/90 backdrop-blur-sm">
                  ✓ Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Name and Age */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">
              {currentCandidate.first_name} {currentCandidate.last_name}
            </h3>
            {currentCandidate.age && (
              <span className="text-lg text-muted-foreground">
                {currentCandidate.age}
              </span>
            )}
          </div>

          {/* University */}
          <p className="text-sm text-muted-foreground mb-2">
            📚 {currentCandidate.university}
          </p>

          {/* Bio */}
          {currentCandidate.bio && (
            <p className="text-sm mb-3 line-clamp-2">
              {currentCandidate.bio}
            </p>
          )}

          {/* Interests */}
          {currentCandidate.interests && currentCandidate.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {currentCandidate.interests.slice(0, 3).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {currentCandidate.interests.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{currentCandidate.interests.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={() => handleSwipe('left')}
              variant="outline"
              size="lg"
              className="flex-1 border-2 border-destructive/20 hover:bg-destructive/10"
              disabled={subscriptionTier === 'free' && swipesLeft <= 0}
            >
              <X className="w-5 h-5 text-destructive" />
            </Button>
            <Button
              onClick={() => handleSwipe('right')}
              size="lg"
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={subscriptionTier === 'free' && swipesLeft <= 0}
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Out of swipes message */}
      {subscriptionTier === 'free' && swipesLeft <= 0 && (
        <Card className="mt-4 border-2 border-primary/20 bg-gradient-card">
          <CardContent className="p-4 text-center">
            <Crown className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-semibold mb-2">Daily limit reached!</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade to Premium for unlimited swipes and exclusive features
            </p>
            <Button 
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SwipeManager;