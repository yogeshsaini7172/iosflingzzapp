import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, GraduationCap, Eye } from "lucide-react";
import type { Profile } from "@/hooks/useFeed";

interface PairCardProps {
  profile: Profile;
  onSwipe: (type: "like" | "pass") => void;
  onViewProfile?: () => void;
}

export function PairCard({ profile, onSwipe, onViewProfile }: PairCardProps) {
  const photos = Array.isArray(profile.photos) ? profile.photos : [];
  const primaryPhoto = photos.length > 0 ? photos[0] : null;
  
  // Handle different photo formats
  const getPhotoUrl = (photo: any) => {
    if (typeof photo === 'string') return photo;
    if (photo?.url) return photo.url;
    if (photo?.publicUrl) return photo.publicUrl;
    return null;
  };

  const photoUrl = getPhotoUrl(primaryPhoto);

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
      <div className="relative">
        {/* Photo Section */}
        <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={profile.display_name} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <p className="text-sm">No photo</p>
              </div>
            </div>
          )}
          
          {/* Photo count indicator */}
          {photos.length > 1 && (
            <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0">
              📸 {photos.length}
            </Badge>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Basic info overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-xl font-bold mb-1">
              {profile.display_name}, {profile.age}
            </h3>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <MapPin className="w-3 h-3" />
              <span>{profile.location || "Location not specified"}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.interests.slice(0, 4).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 4 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  +{profile.interests.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onSwipe("pass")}
              className="flex-1 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600"
            >
              <X className="w-4 h-4 mr-2" />
              Pass
            </Button>
            
            {onViewProfile && (
              <Button
                variant="outline"
                onClick={onViewProfile}
                className="px-3"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              onClick={() => onSwipe("like")}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0"
            >
              <Heart className="w-4 h-4 mr-2" />
              Like
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}