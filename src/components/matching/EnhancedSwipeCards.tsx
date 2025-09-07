import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, X, Star, Shield, MapPin, GraduationCap, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  name: string;
  age: number;
  photos: string[];
  bio: string;
  university: string;
  year: number;
  interests: string[];
  compatibilityScore: number;
  distance: string;
  isVerified: boolean;
  lifestyle: {
    smoking: string;
    drinking: string;
    fitness: string;
  };
  personalityType: string;
  relationshipGoals: string[];
}

interface EnhancedSwipeCardsProps {
  onNavigate: (view: string) => void;
  subscriptionTier: 'free' | 'starter' | 'plus' | 'pro';
}

const EnhancedSwipeCards = ({ onNavigate, subscriptionTier }: EnhancedSwipeCardsProps) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const { toast } = useToast();

  // Mock enhanced profiles with compatibility scores
  const mockProfiles: UserProfile[] = [
    {
      id: "1",
      name: "Priya",
      age: 21,
      photos: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
      bio: "Computer Science student who loves coding, coffee, and cats. Looking for someone to explore the city with and share deep conversations.",
      university: "IIT Delhi",
      year: 3,
      interests: ["Coding", "Coffee", "Movies", "Travel", "Music"],
      compatibilityScore: 92,
      distance: "2 km away",
      isVerified: true,
      lifestyle: {
        smoking: "never",
        drinking: "socially",
        fitness: "active"
      },
      personalityType: "introvert",
      relationshipGoals: ["serious relationship", "friendship"]
    },
    {
      id: "2",
      name: "Arjun",
      age: 22,
      photos: ["/placeholder.svg", "/placeholder.svg"],
      bio: "Mechanical Engineering student. Gym enthusiast, foodie, and adventure seeker. Let's grab coffee and talk about life!",
      university: "BITS Pilani",
      year: 4,
      interests: ["Fitness", "Food", "Adventure", "Photography", "Sports"],
      compatibilityScore: 87,
      distance: "5 km away",
      isVerified: true,
      lifestyle: {
        smoking: "never",
        drinking: "regularly",
        fitness: "very-active"
      },
      personalityType: "extrovert",
      relationshipGoals: ["casual dating", "serious relationship"]
    },
    {
      id: "3", 
      name: "Ananya",
      age: 20,
      photos: ["/placeholder.svg"],
      bio: "Art student with a passion for painting and poetry. Love exploring museums and trying new cuisines.",
      university: "NID Ahmedabad",
      year: 2,
      interests: ["Art", "Poetry", "Museums", "Food", "Reading"],
      compatibilityScore: 78,
      distance: "8 km away",
      isVerified: false,
      lifestyle: {
        smoking: "occasionally",
        drinking: "socially",
        fitness: "moderate"
      },
      personalityType: "ambivert",
      relationshipGoals: ["friendship", "casual dating"]
    }
  ];

  useEffect(() => {
    setProfiles(mockProfiles);
  }, []);

  const currentProfile = profiles[currentIndex];

  // Reset image index when profile changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentIndex]);

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!currentProfile?.photos || currentProfile.photos.length <= 1) return;
    
    const totalImages = currentProfile.photos.length;
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  const handleSwipe = (direction: 'like' | 'pass' | 'super-like') => {
    if (isAnimating || !currentProfile) return;

    // Check subscription limits
    if (direction === 'super-like' && subscriptionTier === 'free') {
      toast({
        title: "Upgrade Required",
        description: "Super likes are available for Premium users only",
        variant: "destructive"
      });
      return;
    }

    setIsAnimating(true);

    const messages = {
      'like': `You liked ${currentProfile.name}!`,
      'pass': `You passed on ${currentProfile.name}`,
      'super-like': `You super liked ${currentProfile.name}! 💫`
    };

    toast({
      title: messages[direction],
      description: direction === 'like' ? "If they like you back, it's a match!" : undefined
    });

    // Simulate match for demonstration
    if (direction === 'like' && currentProfile.compatibilityScore > 85) {
      setTimeout(() => {
        toast({
          title: "🎉 IT'S A MATCH!",
          description: `You and ${currentProfile.name} liked each other!`
        });
      }, 1000);
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setCurrentImageIndex(0); // Reset image index for next profile
      setIsAnimating(false);
    }, 300);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-amber-500";
    return "bg-gray-500";
  };

  const getCompatibilityText = (score: number) => {
    if (score >= 90) return "Excellent Match";
    if (score >= 80) return "Great Match";
    if (score >= 70) return "Good Match";
    return "Okay Match";
  };

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold">No more profiles!</h2>
          <p className="text-muted-foreground">Check back later for new people to discover.</p>
          <Button onClick={() => onNavigate('home')} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Mobile-Optimized Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => onNavigate('home')} className="touch-manipulation">
            ← Back
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant={blindMode ? "default" : "outline"}
              size="sm"
              onClick={() => setBlindMode(!blindMode)}
              className="text-xs px-3 py-2 touch-manipulation"
            >
              🎭 Blind
            </Button>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {subscriptionTier === 'free' ? 'Free' : subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="w-full px-3 py-4 pb-20">
        {/* Mobile-Optimized Profile Card */}
        <Card className="relative overflow-hidden shadow-card border-0 mb-6 rounded-3xl">
          {/* Mobile Compatibility Score */}
          <div className="absolute top-3 left-3 z-10">
            <div className={`${getCompatibilityColor(currentProfile.compatibilityScore)} text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg`}>
              {currentProfile.compatibilityScore}%
            </div>
          </div>

          {/* Mobile Verification Badge */}
          {currentProfile.isVerified && (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="default" className="bg-emerald-500 text-white text-xs px-2 py-1">
                <Shield className="h-3 w-3 mr-1" />
                ✓
              </Badge>
            </div>
          )}

          <CardContent className="p-0">
            {/* Mobile Photo Section */}
            {!blindMode && (
              <div className="aspect-[3/4] bg-muted relative">
                {currentProfile.photos && currentProfile.photos.length > 0 ? (
                  <>
                    {/* Tinder-style Progress Bars */}
                    {currentProfile.photos.length > 1 && (
                      <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
                        {currentProfile.photos.map((_, index) => (
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

                    <img
                      src={currentProfile.photos[currentImageIndex]}
                      alt={`${currentProfile.name}'s profile photo ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Invisible tap areas for navigation */}
                    {currentProfile.photos.length > 1 && (
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
                    {currentProfile.photos.length > 1 && (
                      <div className="absolute top-16 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-20">
                        {currentImageIndex + 1}/{currentProfile.photos.length}
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
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <h2 className="text-white text-xl font-bold mb-1 leading-tight">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  <div className="flex items-center text-white/80 text-sm">
                    <MapPin className="h-3 w-3 mr-1" />
                    {currentProfile.distance}
                  </div>
                  <div className="mt-2">
                    <span className={`${getCompatibilityColor(currentProfile.compatibilityScore)} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                      {getCompatibilityText(currentProfile.compatibilityScore)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Profile Info */}
            <div className="p-5 space-y-4">
              {blindMode && (
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">{currentProfile.name}, {currentProfile.age}</h2>
                  <div className="flex items-center justify-center text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {currentProfile.distance}
                  </div>
                </div>
              )}

              {/* Education */}
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>{currentProfile.university} • Year {currentProfile.year}</span>
              </div>

              {/* Bio */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentProfile.bio}
              </p>

              {/* Lifestyle */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Lifestyle</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">🚭 {currentProfile.lifestyle.smoking}</Badge>
                  <Badge variant="outline">🍺 {currentProfile.lifestyle.drinking}</Badge>
                  <Badge variant="outline">💪 {currentProfile.lifestyle.fitness}</Badge>
                </div>
              </div>

              {/* Personality */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Personality</h4>
                <Badge variant="outline">{currentProfile.personalityType}</Badge>
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.slice(0, 6).map((interest, index) => (
                    <Badge key={index} variant="secondary">{interest}</Badge>
                  ))}
                  {currentProfile.interests.length > 6 && (
                    <Badge variant="secondary">+{currentProfile.interests.length - 6} more</Badge>
                  )}
                </div>
              </div>

              {/* Relationship Goals */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Looking for</h4>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.relationshipGoals.map((goal, index) => (
                    <Badge key={index} variant="outline" className="border-primary/50">{goal}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-Optimized Action Buttons */}
        <div className="flex justify-center items-center gap-6 px-4">
          <Button
            variant="outline"
            size="lg"
            className="h-16 w-16 rounded-full border-2 border-red-200 hover:bg-red-50 hover:border-red-300 touch-manipulation shadow-md"
            onClick={() => handleSwipe('pass')}
            disabled={isAnimating}
          >
            <X className="h-7 w-7 text-red-500" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-18 w-18 rounded-full border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 touch-manipulation shadow-md"
            onClick={() => handleSwipe('super-like')}
            disabled={isAnimating}
          >
            <Star className="h-8 w-8 text-blue-500" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-16 w-16 rounded-full border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 touch-manipulation shadow-md"
            onClick={() => handleSwipe('like')}
            disabled={isAnimating}
          >
            <Heart className="h-7 w-7 text-emerald-500" />
          </Button>
        </div>

        {/* Mobile Subscription Limit Warning */}
        {subscriptionTier === 'free' && (
          <div className="mt-6 mx-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-sm text-amber-800 text-center leading-relaxed">
              Upgrade to Premium to unlock super likes and see who liked you!
            </p>
            <Button variant="outline" size="sm" className="w-full mt-3 touch-manipulation">
              Upgrade Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSwipeCards;