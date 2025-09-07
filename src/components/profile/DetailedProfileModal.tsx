import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Coffee,
  Music,
  Camera,
  Gamepad2,
  Plane,
  Book,
  Dumbbell,
  Shield,
  Brain,
  Star,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DetailedProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    user_id: string;
    first_name: string;
    last_name?: string;
    university: string;
    profile_images?: string[];
    bio?: string;
    total_qcs?: number;
    compatibility_score?: number;
    can_chat?: boolean;
    age?: number;
    location?: string;
    occupation?: string;
    interests?: string[];
    education?: string;
    height?: string | number;
    relationship_goals?: string | string[];
    smoking?: string;
    drinking?: string;
    exercise?: string;
    pets?: string;
  };
  onChatRequest?: (userId: string, canChat: boolean) => void;
  onSwipe?: (direction: "left" | "right") => Promise<void>;
}

const DetailedProfileModal: React.FC<DetailedProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onChatRequest,
  onSwipe
}) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  
  const mockProfileData = {
    age: 23,
    location: "Mumbai, India",
    occupation: "Software Engineer",
    interests: ["Photography", "Travel", "Music", "Coffee", "Fitness"],
    education: `Computer Science, ${profile.university}`,
    height: "5'8\"",
    relationship_goals: "Long-term relationship",
    smoking: "Never",
    drinking: "Socially",
    exercise: "Regular",
    pets: "Love dogs"
  };

  const images = profile.profile_images && profile.profile_images.length > 0 
    ? profile.profile_images 
    : [];
  const totalImages = images.length;

  // Reset image index when modal opens or profile changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [profile.user_id]);

  const nextImage = () => {
    if (totalImages > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    }
  };

  const prevImage = () => {
    if (totalImages > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  const getInterestIcon = (interest: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'Photography': Camera,
      'Travel': Plane,
      'Music': Music,
      'Coffee': Coffee,
      'Fitness': Dumbbell,
      'Gaming': Gamepad2,
      'Reading': Book,
    };
    return iconMap[interest] || Star;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Profile Details
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Profile Images Carousel */}
        <div className="relative">
          <div className="h-96 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center relative overflow-hidden">
            {images.length > 0 ? (
              <>
                <img 
                  src={images[currentImageIndex]} 
                  alt={`${profile.first_name}'s photo ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Tinder-style Progress Bars */}
                <div className="absolute top-3 left-3 right-3 flex gap-1">
                  {images.map((_, index) => (
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

                {/* Invisible tap areas for navigation */}
                {images.length > 1 && (
                  <>
                    <div 
                      className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
                      onClick={prevImage}
                    />
                    <div 
                      className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
                      onClick={nextImage}
                    />
                  </>
                )}

                {/* Photo count indicator */}
                <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded-full backdrop-blur-sm">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-8xl animate-pulse">👤</div>
                <p className="text-muted-foreground">No photos available</p>
              </div>
            )}
            
            {/* Verification Badge */}
            <div className="absolute bottom-4 left-4 bg-blue-500 rounded-full p-2 z-20">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <h2 className="text-3xl font-bold">{profile.first_name}</h2>
              <span className="text-2xl text-muted-foreground">{mockProfileData.age}</span>
            </div>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{mockProfileData.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <GraduationCap className="w-4 h-4" />
                <span>{profile.university}</span>
              </div>
            </div>

            {/* Compatibility Score */}
            <div className="flex justify-center space-x-3 mt-4">
              <Badge className={`text-lg py-2 px-4 ${
                (profile.compatibility_score || 0) >= 90 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : (profile.compatibility_score || 0) >= 80
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-purple-100 text-purple-700 border-purple-200'
              }`}>
                🔥 {profile.compatibility_score}% Match
              </Badge>
              
              {profile.total_qcs && (
                <Badge variant="outline" className="py-2 px-4">
                  <Brain className="w-4 h-4 mr-1" />
                  QCS: {profile.total_qcs}
                </Badge>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <Card className="bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-center text-muted-foreground leading-relaxed">
                  "{profile.bio}"
                </p>
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          <div>
            <h3 className="font-semibold mb-3 text-center">Interests</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {mockProfileData.interests.map((interest, index) => {
                const IconComponent = getInterestIcon(interest);
                return (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="py-2 px-3 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:scale-105 transition-transform"
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {interest}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/30 dark:bg-white/5 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Briefcase className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="font-semibold text-sm">{mockProfileData.occupation}</p>
                <p className="text-xs text-muted-foreground">Profession</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/30 dark:bg-white/5 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <GraduationCap className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-sm">{mockProfileData.education}</p>
                <p className="text-xs text-muted-foreground">Education</p>
              </CardContent>
            </Card>
          </div>

          {/* Lifestyle Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-center">Lifestyle</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Height:</span>
                <span className="font-medium">{mockProfileData.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exercise:</span>
                <span className="font-medium">{mockProfileData.exercise}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Smoking:</span>
                <span className="font-medium">{mockProfileData.smoking}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Drinking:</span>
                <span className="font-medium">{mockProfileData.drinking}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1 border-red-200 hover:bg-red-50 text-red-600"
              onClick={async () => {
                if (onSwipe) {
                  await onSwipe("left");
                }
                onClose();
              }}
            >
              ❌ Pass
            </Button>
            
            {profile.can_chat && onChatRequest ? (
              <Button 
                onClick={() => {
                  onChatRequest(profile.user_id, true);
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat Now
              </Button>
            ) : (
              <Button 
                onClick={async () => {
                  if (onSwipe) {
                    await onSwipe("right");
                  } else if (onChatRequest) {
                    onChatRequest(profile.user_id, false);
                  }
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {onSwipe ? "Like" : "Chat Request"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedProfileModal;