import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Heart, 
  X, 
  Star, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Zap,
  RotateCcw,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  name: string;
  age: number;
  images: string[];
  bio: string;
  location: string;
  university: string;
  major: string;
  interests: string[];
  height: number;
  lookingFor: string;
  verified: boolean;
  distance: number;
}

interface PremiumSwipeCardsProps {
  onNavigate: (view: string) => void;
}

const PremiumSwipeCards = ({ onNavigate }: PremiumSwipeCardsProps) => {
  const [profiles] = useState<Profile[]>([
    {
      id: '1',
      name: 'Emma',
      age: 21,
      images: [
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600'
      ],
      bio: 'Psychology major who loves hiking, coffee, and deep conversations under the stars. Looking for someone genuine to explore the world with! ✨',
      location: 'Stanford University',
      university: 'Stanford',
      major: 'Psychology',
      interests: ['hiking', 'coffee', 'psychology', 'photography'],
      height: 165,
      lookingFor: 'serious',
      verified: true,
      distance: 0.5
    },
    {
      id: '2',
      name: 'Alex',
      age: 23,
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600'
      ],
      bio: 'Computer Science student passionate about AI and music. Love playing guitar and exploring new cafes around campus. Always up for an adventure!',
      location: 'Stanford University',
      university: 'Stanford',
      major: 'Computer Science',
      interests: ['music', 'AI', 'guitar', 'coffee'],
      height: 178,
      lookingFor: 'casual',
      verified: false,
      distance: 1.2
    },
    {
      id: '3',
      name: 'Sophia',
      age: 20,
      images: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'
      ],
      bio: 'Art History major with a passion for painting and traveling. I believe life is about collecting beautiful moments and meaningful connections.',
      location: 'Stanford University',
      university: 'Stanford',
      major: 'Art History',
      interests: ['art', 'painting', 'travel', 'history'],
      height: 160,
      lookingFor: 'serious',
      verified: true,
      distance: 2.1
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [swipesLeft, setSwipesLeft] = useState(8);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  const currentProfile = profiles[currentIndex];

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (swipesLeft <= 0) return;
    
    setSwipeDirection(direction);
    setSwipesLeft(prev => prev - 1);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
      setCurrentImageIndex(0);
      setShowDetails(false);
    }, 300);
  }, [swipesLeft]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (swipesLeft <= 0) return;
    setIsDragging(true);
    startX.current = e.clientX;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX.current;
    setDragOffset(deltaX);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(dragOffset) > 100) {
      handleSwipe(dragOffset > 0 ? 'right' : 'left');
    }
    
    setDragOffset(0);
  }, [isDragging, dragOffset, handleSwipe]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const nextImage = () => {
    if (currentProfile && currentImageIndex < currentProfile.images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  if (currentIndex >= profiles.length || swipesLeft <= 0) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="text-center p-8 max-w-md shadow-medium border-0">
          <CardContent>
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {swipesLeft <= 0 ? 'Daily Limit Reached!' : 'No More Profiles'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {swipesLeft <= 0 
                ? 'Come back tomorrow for more profiles, or upgrade to Premium for unlimited swipes!'
                : 'You\'ve seen all available profiles. Check back later for new matches!'
              }
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-secondary"
                onClick={() => onNavigate('home')}
              >
                <Star className="w-4 h-4 mr-2" />
                Go Premium
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onNavigate('home')}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('home')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Discover</h1>
              <p className="text-sm text-muted-foreground">{swipesLeft} swipes left</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20">
              {swipesLeft}/{10}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Main Card Stack */}
        <div className="relative h-[600px] mb-6">
          {/* Background cards for stacking effect */}
          {profiles.slice(currentIndex + 1, currentIndex + 3).map((_, index) => (
            <div
              key={`bg-${index}`}
              className={`absolute inset-0 bg-card rounded-2xl shadow-card border-0 ${
                index === 0 ? 'scale-95 -rotate-1' : 'scale-90 rotate-1'
              }`}
              style={{ zIndex: 1 - index }}
            />
          ))}

          {/* Main Card */}
          <div
            ref={cardRef}
            className={cn(
              "absolute inset-0 rounded-2xl overflow-hidden shadow-medium border-0 cursor-grab active:cursor-grabbing transition-transform duration-300",
              isDragging && "cursor-grabbing",
              swipeDirection === 'right' && "translate-x-full rotate-12 opacity-0",
              swipeDirection === 'left' && "-translate-x-full -rotate-12 opacity-0"
            )}
            style={{
              transform: isDragging ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.1}deg)` : undefined,
              zIndex: 10
            }}
            onMouseDown={handleMouseDown}
          >
            <Card className="h-full border-0 overflow-hidden">
              {/* Image Section */}
              <div className="relative h-[400px] overflow-hidden">
                <img
                  src={currentProfile.images[currentImageIndex]}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                <div className="absolute top-4 left-4 right-4 flex gap-1">
                  {currentProfile.images.map((_, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-1 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Image tap areas */}
                <div className="absolute inset-0 flex">
                  <div className="flex-1" onClick={prevImage} />
                  <div className="flex-1" onClick={nextImage} />
                </div>

                {/* Verification badge */}
                {currentProfile.verified && (
                  <Badge className="absolute top-4 right-4 bg-primary text-white border-0">
                    <Star className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}

                {/* Swipe feedback */}
                {isDragging && (
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center text-6xl font-bold transition-opacity",
                      dragOffset > 50 ? "text-success opacity-80" : "opacity-0"
                    )}
                  >
                    ❤️
                  </div>
                )}
                {isDragging && (
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center text-6xl font-bold transition-opacity",
                      dragOffset < -50 ? "text-destructive opacity-80" : "opacity-0"
                    )}
                  >
                    ❌
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Basic Info */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {currentProfile.name}, {currentProfile.age}
                      </h2>
                      <div className="flex items-center gap-2 text-white/90">
                        <MapPin className="w-4 h-4" />
                        <span>{currentProfile.distance} km away</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <CardContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {currentProfile.bio}
                </p>

                {showDetails && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>{currentProfile.major} at {currentProfile.university}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span>Looking for {currentProfile.lookingFor}</span>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSwipe('left')}
            disabled={swipesLeft <= 0}
            className="w-14 h-14 rounded-full border-2 border-destructive/20 hover:border-destructive hover:bg-destructive/10"
          >
            <X className="w-6 h-6 text-destructive" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full border-2 border-primary/20 hover:border-primary"
          >
            <RotateCcw className="w-5 h-5 text-primary" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSwipe('right')}
            disabled={swipesLeft <= 0}
            className="w-14 h-14 rounded-full border-2 border-success/20 hover:border-success hover:bg-success/10"
          >
            <Heart className="w-6 h-6 text-success" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full border-2 border-secondary/20 hover:border-secondary hover:bg-secondary/10"
          >
            <Zap className="w-5 h-5 text-secondary" />
          </Button>
        </div>

        {/* Upgrade prompt */}
        {swipesLeft <= 2 && (
          <Card className="mt-6 bg-gradient-secondary border-0 text-white animate-fade-in">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold mb-2">Running low on swipes!</h3>
              <p className="text-sm opacity-90 mb-3">
                Upgrade to Premium for unlimited swipes and advanced features
              </p>
              <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Star className="w-4 h-4 mr-1" />
                Go Premium
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PremiumSwipeCards;