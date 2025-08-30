import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, RotateCcw, MessageCircle, MapPin, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SwipeCardsProps {
  onNavigate: (view: 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches') => void;
}

// Mock profile data for demonstration
const mockProfiles = [
  {
    id: '1',
    firstName: 'Emma',
    lastName: 'Johnson',
    age: 21,
    bio: 'Art student who loves photography, coffee shops, and spontaneous adventures. Looking for someone to explore the city with!',
    university: 'NYU',
    major: 'Fine Arts',
    yearOfStudy: 3,
    location: 'New York, NY',
    interests: ['Photography', 'Art', 'Coffee', 'Travel', 'Music'],
    images: ['https://images.unsplash.com/photo-1494790108755-2616c57c8458?w=400&h=600&fit=crop&crop=face'],
    verified: true
  },
  {
    id: '2',
    firstName: 'Alex',
    lastName: 'Chen',
    age: 22,
    bio: 'Computer Science major passionate about AI and machine learning. When not coding, you can find me playing guitar or hiking.',
    university: 'Stanford',
    major: 'Computer Science',
    yearOfStudy: 4,
    location: 'Palo Alto, CA',
    interests: ['Technology', 'Music', 'Hiking', 'Gaming', 'Coding'],
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face'],
    verified: true
  },
  {
    id: '3',
    firstName: 'Sophia',
    lastName: 'Martinez',
    age: 20,
    bio: 'Pre-med student with a passion for helping others. Love dancing, cooking, and trying new cuisines. Fluent in Spanish and English.',
    university: 'Harvard',
    major: 'Biology',
    yearOfStudy: 2,
    location: 'Cambridge, MA',
    interests: ['Medicine', 'Dancing', 'Cooking', 'Languages', 'Fitness'],
    images: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face'],
    verified: true
  }
];

const SwipeCards = ({ onNavigate }: SwipeCardsProps) => {
  const [profiles] = useState(mockProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentProfile = profiles[currentIndex];

  const handleSwipe = (direction: 'like' | 'pass') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    if (direction === 'like') {
      toast({
        title: "It's a Match! 💕",
        description: `You liked ${currentProfile.firstName}. If they like you back, you'll match!`,
      });
    }

    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % profiles.length);
      setIsAnimating(false);
    }, 300);
  };

  const handleSuperLike = () => {
    toast({
      title: "Super Like Sent! ⭐",
      description: `You super liked ${currentProfile.firstName}. They'll know you're really interested!`,
    });
    handleSwipe('like');
  };

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">No More Profiles</h2>
            <p className="text-muted-foreground mb-6">
              You've seen all available profiles. Check back later for new matches!
            </p>
            <Button onClick={() => onNavigate('home')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onNavigate('home')}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold">Discover</h1>
          <Button variant="ghost" onClick={() => onNavigate('matches')}>
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <div className="pt-20 pb-24 flex items-center justify-center min-h-screen">
        <div className="relative w-full max-w-sm">
          <Card 
            ref={cardRef}
            className={`relative overflow-hidden transition-transform duration-300 ${
              isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
            }`}
          >
            {/* Profile Image */}
            <div className="relative h-96">
              <img
                src={currentProfile.images[0]}
                alt={currentProfile.firstName}
                className="w-full h-full object-cover"
              />
              
              {/* Verified Badge */}
              {currentProfile.verified && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500 text-white">
                    ✓ Verified
                  </Badge>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Basic Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-2xl font-bold">
                  {currentProfile.firstName}, {currentProfile.age}
                </h2>
                <div className="flex items-center gap-2 text-sm opacity-90 mt-1">
                  <GraduationCap className="w-4 h-4" />
                  {currentProfile.major} • Year {currentProfile.yearOfStudy}
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <MapPin className="w-4 h-4" />
                  {currentProfile.university} • {currentProfile.location}
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              {/* Bio */}
              <p className="text-sm text-muted-foreground mb-4">
                {currentProfile.bio}
              </p>

              {/* Interests */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.map(interest => (
                    <Badge key={interest} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center items-center gap-4 max-w-sm mx-auto">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 p-0 border-2 border-red-500 hover:bg-red-500 hover:text-white"
              onClick={() => handleSwipe('pass')}
              disabled={isAnimating}
            >
              <X className="w-6 h-6" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-12 h-12 p-0 border-2 border-blue-500 hover:bg-blue-500 hover:text-white"
              onClick={handleSuperLike}
              disabled={isAnimating}
            >
              ⭐
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 p-0 border-2 border-green-500 hover:bg-green-500 hover:text-white"
              onClick={() => handleSwipe('like')}
              disabled={isAnimating}
            >
              <Heart className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="flex justify-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(prev => (prev - 1 + profiles.length) % profiles.length)}
              disabled={isAnimating}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Undo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeCards;