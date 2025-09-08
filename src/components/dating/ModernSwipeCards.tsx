import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Heart, X, Star, MessageCircle, MapPin, GraduationCap, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModernSwipeCardsProps {
  onNavigate: (view: 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches') => void;
}

// Enhanced mock profiles with prompts
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
    verified: true,
    prompts: [
      { question: "My weekend vibe is...", answer: "Coffee shop hopping and finding new art galleries" },
      { question: "A random fact about me...", answer: "I can paint with my non-dominant hand!" },
      { question: "I'm looking for...", answer: "Someone who appreciates late night conversations" }
    ]
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
    verified: true,
    prompts: [
      { question: "My weekend vibe is...", answer: "Building side projects and jamming on guitar" },
      { question: "A random fact about me...", answer: "I once built an AI that writes song lyrics" },
      { question: "I'm looking for...", answer: "Someone who shares my curiosity about the future" }
    ]
  }
];

const ModernSwipeCards = ({ onNavigate }: ModernSwipeCardsProps) => {
  const [profiles] = useState(mockProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
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
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="text-center p-8 shadow-medium">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">No More Profiles</h2>
            <p className="text-muted-foreground mb-6">
              You've seen all available profiles. Check back later for new matches!
            </p>
            <Button onClick={() => onNavigate('home')} className="bg-gradient-primary">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Modern Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onNavigate('home')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {blindMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <Label htmlFor="blind-mode" className="text-sm font-medium">
                {blindMode ? 'Blind Mode' : 'Photo Mode'}
              </Label>
              <Switch
                id="blind-mode"
                checked={blindMode}
                onCheckedChange={setBlindMode}
              />
            </div>
          </div>
          
          <Button variant="ghost" onClick={() => onNavigate('matches')} className="rounded-full">
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <div className="pt-4 pb-32 flex items-center justify-center min-h-screen">
        <div className="relative w-full max-w-sm">
          <Card 
            ref={cardRef}
            className={`relative overflow-hidden shadow-medium border-0 transition-transform duration-300 ${
              isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
            }`}
          >
            {!blindMode ? (
              <>
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
                      <Badge className="bg-success text-success-foreground shadow-soft">
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
              </>
            ) : (
              /* Blind Mode - No Photo */
              <div className="h-96 bg-gradient-secondary flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <EyeOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h2 className="text-2xl font-bold mb-2">
                    {currentProfile.firstName}, {currentProfile.age}
                  </h2>
                  <div className="text-sm opacity-90">
                    {currentProfile.university} • {currentProfile.major}
                  </div>
                </div>
              </div>
            )}

            <CardContent className="p-6 space-y-6">
              {/* Prompts */}
              <div className="space-y-4">
                {currentProfile.prompts.map((prompt, index) => (
                  <Card key={index} className="p-4 bg-muted/30 border-0">
                    <h4 className="font-semibold text-sm text-primary mb-2">
                      {prompt.question}
                    </h4>
                    <p className="text-sm">
                      {prompt.answer}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.map(interest => (
                    <Badge key={interest} variant="secondary" className="text-xs bg-accent/20 text-accent-foreground">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Action buttons handled by UnifiedLayout */}
        <div className="hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center gap-6 max-w-sm mx-auto">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 p-0 border-2 border-destructive/30 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 shadow-soft"
              onClick={() => handleSwipe('pass')}
              disabled={isAnimating}
            >
              <X className="w-7 h-7" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 p-0 border-2 border-accent/30 hover:border-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-soft"
              onClick={handleSuperLike}
              disabled={isAnimating}
            >
              <Star className="w-6 h-6" fill="currentColor" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 p-0 border-2 border-success/30 hover:border-success hover:bg-success hover:text-success-foreground transition-all duration-300 shadow-soft"
              onClick={() => handleSwipe('like')}
              disabled={isAnimating}
            >
              <Heart className="w-7 h-7" fill="currentColor" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernSwipeCards;