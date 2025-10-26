import React from 'react';
import HeartAnimation from '@/components/ui/HeartAnimation';
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
    physical_score?: number;
    mental_score?: number;
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
    matched_criteria?: string[];
    not_matched_criteria?: string[];
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
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0 bg-gradient-card dark:bg-card">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Profile Details
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Profile Images Carousel */}
        <div className="relative">
          <div className="h-96 bg-gradient-subtle dark:bg-card flex items-center justify-center relative overflow-hidden">
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
                <div className="mx-auto">
                  <HeartAnimation size={96} />
                </div>
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
        <div className="p-6 space-y-6 bg-card/95 backdrop-blur-sm">
          {/* Basic Info */}
          <div className="text-center space-y-3">
            <div className="flex items-baseline justify-center space-x-3">
              <h2 className="text-4xl font-extrabold text-foreground tracking-tight">{profile.first_name} {profile.last_name}</h2>
              <span className="text-3xl font-bold text-foreground/70">{profile.age || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-center space-x-4 text-base text-foreground/70">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="font-medium">{profile.university}</span>
              </div>
            </div>

            {/* Compatibility Scores */}
            <div className="flex justify-center space-x-3 mt-4">
              <Badge className={`text-xl font-bold py-3 px-5 shadow-md ${
                (profile.compatibility_score || 0) >= 90
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : (profile.compatibility_score || 0) >= 80
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-purple-100 text-purple-700 border-purple-200'
              }`}>
                🔥 {profile.compatibility_score || 0}% Match
              </Badge>

              {profile.total_qcs && (
                <Badge variant="outline" className="py-3 px-5 text-base font-semibold shadow-md">
                  <Brain className="w-5 h-5 mr-2" />
                  QCS: {profile.total_qcs}
                </Badge>
              )}
            </div>

            {/* Physical and Mental Scores */}
            <div className="flex justify-center space-x-4 mt-3">
              <Badge variant="secondary" className="text-base font-medium py-2 px-4">
                <Dumbbell className="w-4 h-4 mr-2" />
                Physical: {profile.physical_score || 0}%
              </Badge>
              <Badge variant="secondary" className="text-base font-medium py-2 px-4">
                <Brain className="w-4 h-4 mr-2" />
                Mental: {profile.mental_score || 0}%
              </Badge>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <Card className="bg-card/90 border-2 border-border/50 shadow-sm">
              <CardContent className="p-5">
                <p className="text-center text-base text-foreground/90 leading-relaxed font-normal italic">
                  "{profile.bio}"
                </p>
              </CardContent>
            </Card>
          )}

          {/* Matched Criteria */}
          {(profile.matched_criteria?.length > 0 || profile.not_matched_criteria?.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center text-foreground">Compatibility Details</h3>
              {profile.matched_criteria?.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                  <p className="text-base text-green-700 dark:text-green-400 font-semibold mb-3 flex items-center">
                    <span className="text-lg mr-2">✓</span> Matched Criteria
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.matched_criteria.map((criteria, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 py-1 px-3">
                        {criteria.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.not_matched_criteria?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
                  <p className="text-base text-red-700 dark:text-red-400 font-semibold mb-3 flex items-center">
                    <span className="text-lg mr-2">✗</span> Not Matched Criteria
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.not_matched_criteria.slice(0, 5).map((criteria, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm font-medium text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 py-1 px-3">
                        {criteria.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {profile.not_matched_criteria.length > 5 && (
                      <Badge variant="outline" className="text-sm font-medium text-muted-foreground py-1 px-3">
                        +{profile.not_matched_criteria.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interests */}
          {Array.isArray(profile.interests) && profile.interests.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-center text-foreground">Interests & Hobbies</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {profile.interests.map((interest, index) => {
                  const IconComponent = getInterestIcon(interest);
                  return (
                    <Badge
                      key={index}
                      variant="outline"
                      className="py-2.5 px-4 text-base font-medium bg-card/70 border-2 border-border/50 text-foreground hover:scale-105 hover:shadow-md transition-all"
                    >
                      <IconComponent className="w-5 h-5 mr-2" />
                      {interest}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {onSwipe && (
            <div className="pt-4">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-2 border-white/60 dark:border-gray-700/60 hover:border-red-300 dark:hover:border-red-500 text-red-600 dark:text-red-400 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                  onClick={async () => {
                    await onSwipe("left");
                    onClose();
                  }}
                >
                  <X className="w-5 h-5 mr-2" strokeWidth={2.5} />
                  Pass
                </Button>

                <Button
                  size="lg"
                  className="flex-1 backdrop-blur-xl bg-gradient-to-br from-red-500/90 via-pink-500/90 to-rose-500/90 hover:from-red-600/95 hover:via-pink-600/95 hover:to-rose-600/95 border-2 border-red-400/50 hover:border-red-300/70 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                  onClick={async () => {
                    await onSwipe("right");
                    onClose();
                  }}
                >
                  <Heart className="w-5 h-5 mr-2 fill-white" strokeWidth={2} />
                  Like
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedProfileModal;