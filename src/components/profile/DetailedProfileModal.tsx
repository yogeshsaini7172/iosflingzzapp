import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, X, MoreHorizontal, MapPin, Cake, User, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetailedProfileModalProps {
  profile: any;
  isOpen: boolean;
  onClose: () => void;
  onSwipe: (direction: 'left' | 'right') => void;
}

const DetailedProfileModal = ({ profile, isOpen, onClose, onSwipe }: DetailedProfileModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!profile) return null;

  const handleSwipe = (direction: 'left' | 'right') => {
    onSwipe(direction);
    onClose();
  };

  const getOrientationLabel = (gender: string, relationshipGoals: string[]) => {
    // Simple logic - in real app this would be more sophisticated
    if (relationshipGoals?.includes('serious relationship')) return 'Looking for serious';
    if (relationshipGoals?.includes('casual dating')) return 'Casual';
    return 'Straight'; // Default fallback
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[90vh] p-0 overflow-hidden">
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-20 p-4 bg-transparent">
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white bg-black/20 backdrop-blur-sm rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
              <h2 className="text-white font-semibold bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
                {profile.first_name}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-black/20 backdrop-blur-sm rounded-full"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            {/* Main Profile Image */}
            <div className="relative h-80">
              {profile.profile_images && profile.profile_images.length > 0 ? (
                <img
                  src={profile.profile_images[currentImageIndex] || profile.profile_images[0]}
                  alt={profile.first_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-6xl mb-4">👤</div>
                    <p>No Photo</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            {/* Profile Details */}
            <div className="p-6 space-y-6 bg-white">
              {/* Basic Info Icons */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Cake className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-lg font-semibold">{profile.age}</div>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-sm font-medium capitalize">{profile.gender}</div>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <BookOpen className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-sm font-medium">
                    {getOrientationLabel(profile.gender, profile.relationship_goals)}
                  </div>
                </div>
              </div>

              {/* Religion/Beliefs */}
              {profile.values && (
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-600" />
                  <span className="font-medium capitalize">{profile.values}</span>
                </div>
              )}

              {/* Dating Goals */}
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">
                  {profile.relationship_goals?.[0] || "Figuring out my dating goals"}
                </span>
              </div>

              {/* Additional Photos */}
              {profile.profile_images && profile.profile_images.length > 1 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">More Photos</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {profile.profile_images.slice(1, 3).map((image: string, index: number) => (
                      <div 
                        key={index} 
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setCurrentImageIndex(index + 1)}
                      >
                        <img
                          src={image}
                          alt={`${profile.first_name} ${index + 2}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio/About */}
              {profile.bio && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">About {profile.first_name}</h3>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* University Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Education</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span>{profile.university}</span>
                  </div>
                  {profile.major && (
                    <div className="text-gray-600">
                      {profile.major} • Year {profile.year_of_study}
                    </div>
                  )}
                </div>
              </div>

              {/* Personality */}
              {profile.personality_type && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Personality</h3>
                  <Badge variant="outline" className="text-sm">
                    {profile.personality_type}
                  </Badge>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
            <div className="flex justify-center gap-6">
              <Button
                onClick={() => handleSwipe('left')}
                size="icon"
                variant="outline"
                className="w-14 h-14 rounded-full border-2 hover:bg-red-50 hover:border-red-300"
              >
                <X className="w-6 h-6 text-red-500" />
              </Button>
              
              <Button
                onClick={() => handleSwipe('right')}
                size="icon"
                className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              >
                <Heart className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedProfileModal;