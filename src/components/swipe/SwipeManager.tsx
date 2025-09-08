import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, Crown, Zap } from 'lucide-react';

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
      const { data, error } = await supabase
        .from('profiles')
        .select('swipes_left, subscription_tier')
        .eq('user_id', user.uid)
        .single();

      if (error) throw error;

      setSwipesLeft(data.swipes_left || 0);
      setSubscriptionTier(data.subscription_tier || 'free');
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCandidates = async () => {
    if (!user) return;

    try {
      // Get user's partner preferences
      const { data: preferences } = await supabase
        .from('partner_preferences')
        .select('*')
      .eq('user_id', user.uid)
        .single();

      // Get candidates based on preferences
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.uid)  // Exclude self
        .eq('is_profile_public', true)  // Only public profiles
        .limit(20);

          // Apply gender filter if preferences exist
          if (preferences?.preferred_gender?.length > 0) {
            // Cast to the proper type
            const genderFilter = preferences.preferred_gender as ('male' | 'female' | 'non_binary' | 'prefer_not_to_say')[];
            query = query.in('gender', genderFilter);
          }

      // Apply age filter if preferences exist
      if (preferences?.age_range_min && preferences?.age_range_max) {
        const currentYear = new Date().getFullYear();
        const maxBirthYear = currentYear - preferences.age_range_min;
        const minBirthYear = currentYear - preferences.age_range_max;
        
        query = query
          .gte('date_of_birth', `${minBirthYear}-01-01`)
          .lte('date_of_birth', `${maxBirthYear}-12-31`);
      }

      const { data: candidatesData, error } = await query;

      if (error) throw error;

      // Filter out already swiped users
      const { data: swipedUsers } = await supabase
        .from('swipes')
        .select('candidate_id')
        .eq('user_id', user.uid);

      const swipedIds = swipedUsers?.map(s => s.candidate_id) || [];
      const filteredCandidates = candidatesData?.filter(
        candidate => !swipedIds.includes(candidate.user_id)
      ) || [];

      // Calculate age for each candidate
      const candidatesWithAge = filteredCandidates.map(candidate => ({
        ...candidate,
        age: candidate.date_of_birth ? 
          new Date().getFullYear() - new Date(candidate.date_of_birth).getFullYear() : 
          undefined
      }));

      setCandidates(candidatesWithAge);
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
      // Record the swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          user_id: user.uid,
          candidate_id: currentCandidate.user_id,
          direction: direction
        });

      if (swipeError) throw swipeError;

      // Update swipes left for free users
      if (subscriptionTier === 'free') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ swipes_left: swipesLeft - 1 })
          .eq('user_id', user.uid);

        if (updateError) throw updateError;
        setSwipesLeft(prev => prev - 1);
      }

      // Check for match if right swipe
      if (direction === 'right') {
        const { data: reciprocalSwipe } = await supabase
          .from('swipes')
          .select('*')
          .eq('user_id', currentCandidate.user_id)
          .eq('candidate_id', user.uid)
          .eq('direction', 'right')
          .single();

        if (reciprocalSwipe) {
          // It's a match — ask server to finalize match creation (enhanced_matches, chat_rooms, notifications)
          try {
            // call server-side edge function that handles match creation atomically
            const { data: fnData, error: fnError } = await supabase.functions.invoke(
              'enhanced-swipe-action',
              {
                body: {
                  user_id: user.uid,
                  target_user_id: currentCandidate.user_id,
                  direction: 'right',
                }
              }
            );

            if (fnError) {
              console.error('enhanced-swipe-action error:', fnError);
              // fallback: show a friendly message but don't write legacy matches client-side
              toast({
                title: "Match detected",
                description: `You and ${currentCandidate.first_name} liked each other! (server processing)`,
              });
            } else {
              // server handled the match — show toast & optionally use returned data
              toast({
                title: "🎉 It's a Match!",
                description: `You and ${currentCandidate.first_name} liked each other!`,
              });

              // if the function returns match & chat_room, you can optionally redirect user to chat:
              // const match = fnData?.match;
              // const chatRoom = fnData?.chat_room;
              // navigate to chatRoom if you want immediate chat open
            }
          } catch (err) {
            console.error('Error invoking enhanced-swipe-action:', err);
            toast({
              title: "Match detected",
              description: `You and ${currentCandidate.first_name} liked each other!`,
            });
          }
        } else {
          toast({
            title: "Nice choice! 💫",
            description: "We'll let you know if they like you back"
          });
        }
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

      {/* Profile Card */}
      <Card className="overflow-hidden shadow-lg">
        <div className="relative">
          {/* Profile Image */}
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
          </div>

          {/* Verification Badge */}
          {currentCandidate.verification_status === 'verified' && (
            <Badge className="absolute top-3 right-3 bg-success">
              ✓ Verified
            </Badge>
          )}
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