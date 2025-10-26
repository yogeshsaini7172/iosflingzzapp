import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, MessageCircle, Eye, ShieldCheck, Sparkles } from "lucide-react";
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
    <Card className="group shadow-elegant hover:shadow-royal transition-all duration-500 border-0 bg-white dark:bg-gray-900 rounded-2xl hover:scale-[1.02] animate-fade-in max-w-sm mx-auto">
      {/* Card padding wrapper - Tinder style */}
      <div className="p-3">
        {/* Photo Section with rounded corners */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="aspect-[3/4] bg-gradient-to-br from-muted/50 to-muted relative">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt={profile.display_name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-luxury"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-3xl">👤</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No photo</p>
                </div>
              </div>
            )}
            
            {/* Subtle gradient overlay - Tinder style */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
            {/* Photo count indicator */}
            {photos.length > 1 && (
              <Badge className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white border-0 shadow-lg px-3 py-1.5 font-medium">
                <Sparkles className="w-3 h-3 mr-1.5" />
                {photos.length} photos
              </Badge>
            )}

            {/* User info overlay on image - Tinder style */}
            <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-3xl font-bold text-white drop-shadow-lg truncate">
                      {profile.display_name}, {profile.age}
                    </h3>
                    <ShieldCheck className="w-5 h-5 text-success flex-shrink-0 drop-shadow-lg" />
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium drop-shadow-md">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{profile.location || "Location not set"}</span>
                  </div>
                </div>
              </div>

              {/* Bio preview on hover */}
              {profile.bio && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-sm text-white/95 line-clamp-2 font-medium drop-shadow-md leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-5 space-y-4">
          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs px-3 py-1.5 font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-0"
                >
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 3 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-3 py-1.5 font-medium bg-muted/50 hover:bg-muted transition-colors border-0"
                >
                  +{profile.interests.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons - Premium Design */}
          <div className="flex gap-3">
            {/* Pass Button */}
            <button
              onClick={() => onSwipe("pass")}
              className="group/btn flex-1 relative overflow-hidden rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 hover:from-destructive/20 hover:to-destructive/10 border border-destructive/20 hover:border-destructive/30 transition-all duration-300 py-4 shadow-sm hover:shadow-md active:scale-95"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="p-1.5 rounded-full bg-destructive/10 group-hover/btn:bg-destructive/20 transition-colors">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <span className="text-sm font-semibold text-destructive">Pass</span>
              </div>
            </button>
            
            {/* View Profile Button */}
            {onViewProfile && (
              <button
                onClick={onViewProfile}
                className="group/btn relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 border border-accent/20 hover:border-accent/30 transition-all duration-300 px-5 shadow-sm hover:shadow-md active:scale-95"
              >
                <div className="flex items-center justify-center">
                  <div className="p-1.5 rounded-full bg-accent/10 group-hover/btn:bg-accent/20 transition-colors">
                    <Eye className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </button>
            )}
            
            {/* Like Button - Premium Gradient */}
            <button
              onClick={() => onSwipe("like")}
              className="group/btn flex-1 relative overflow-hidden rounded-xl bg-gradient-royal hover:bg-gradient-primary border-0 transition-all duration-300 py-4 shadow-elegant hover:shadow-royal active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-shimmer" />
              <div className="relative flex items-center justify-center gap-2">
                <div className="p-1.5 rounded-full bg-white/20 group-hover/btn:bg-white/30 transition-colors">
                  <Heart className="w-5 h-5 text-white fill-white/80" />
                </div>
                <span className="text-sm font-bold text-white drop-shadow-sm">Like</span>
              </div>
            </button>
          </div>
        </CardContent>
    </Card>
  );
}
