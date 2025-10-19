import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, MapPin, GraduationCap, Briefcase, Sparkles, Crown } from 'lucide-react';

interface PremiumProfileHeaderProps {
  firstName: string;
  lastName: string;
  bio: string;
  university: string;
  profession: string;
  location: any;
  profileImages: string[];
  onEditPhoto: () => void;
}

const PremiumProfileHeader = ({
  firstName,
  lastName,
  bio,
  university,
  profession,
  location,
  profileImages,
  onEditPhoto,
}: PremiumProfileHeaderProps) => {
  const [imageIndex, setImageIndex] = useState(0);
  const displayImage = profileImages[imageIndex] || '/placeholder.svg';

  return (
    <Card className="premium-card border-0 overflow-hidden group">
      {/* Background Gradient Orb */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/10 via-transparent to-transparent blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
      </div>

      {/* Header Image Section */}
      <div className="relative h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10" />
        <img
          src={displayImage}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Photo Navigation Dots */}
        {profileImages.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 glass-premium px-4 py-2 rounded-full">
            {profileImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === imageIndex 
                    ? 'bg-white w-8' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Edit Photo Button */}
        <Button
          size="icon"
          variant="glass"
          onClick={onEditPhoto}
          className="absolute top-4 right-4 hover-lift"
        >
          <Camera className="w-4 h-4" />
        </Button>

        {/* Premium Badge */}
        <Badge className="absolute top-4 left-4 glass-premium border-0 text-yellow-300 gap-1.5 px-3 py-1.5 text-sm font-bold">
          <Crown className="w-4 h-4 fill-yellow-300" />
          Premium
        </Badge>
      </div>

      {/* Profile Info Section */}
      <div className="p-8 space-y-6">
        {/* Name and Bio */}
        <div className="space-y-3 hover-lift transition-all duration-300">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold gradient-text animate-fade-in">
              {firstName} {lastName}
            </h1>
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          {bio && (
            <p className="text-muted-foreground text-lg leading-relaxed animate-fade-in delay-100">
              {bio}
            </p>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in delay-200">
          {university && (
            <div className="glass-effect p-4 rounded-xl hover-glow group/card transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-primary/10 group-hover/card:bg-gradient-primary/20 transition-colors">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Education</p>
                  <p className="font-semibold text-sm truncate">{university}</p>
                </div>
              </div>
            </div>
          )}

          {profession && (
            <div className="glass-effect p-4 rounded-xl hover-glow group/card transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-primary/10 group-hover/card:bg-gradient-primary/20 transition-colors">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Profession</p>
                  <p className="font-semibold text-sm truncate">{profession}</p>
                </div>
              </div>
            </div>
          )}

          {location && (
            <div className="glass-effect p-4 rounded-xl hover-glow group/card transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-primary/10 group-hover/card:bg-gradient-primary/20 transition-colors">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Location</p>
                  <p className="font-semibold text-sm truncate">
                    {location.city || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PremiumProfileHeader;
