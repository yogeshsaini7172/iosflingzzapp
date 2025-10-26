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
  ChevronRight,
  User,
  Activity,
  Sparkles
} from 'lucide-react';
import { getCurrentLocation, calculateDistance } from '@/utils/locationUtils';
import { CompatibilityGroup, CompatibilityBadge } from '@/components/swipe/CompatibilityBadge';
import { useProfileData } from '@/hooks/useProfileData';

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
    // New fields from database
    values?: string[] | string;
    mindset?: string[] | string;
    body_type?: string;
    face_type?: string;
    lifestyle?: string;
    skin_tone?: string;
    bio_length?: number;
    profession?: string | null;
    profession_description?: string | null;
    love_language?: string;
    field_of_study?: string;
    education_level?: string | null;
    personality_type?: string;
    personality_traits?: string[];
    communication_style?: string;
    profile_completeness?: string;
    // Preferences
    preferences?: {
      age_range_max?: number;
      age_range_min?: number;
      height_range_max?: number;
      height_range_min?: number;
      preferred_gender?: string[];
      preferred_values?: string[];
      preferred_mindset?: string[];
      preferred_interests?: string[];
      preferred_lifestyle?: string[];
      min_shared_interests?: number;
      preferred_body_types?: string[];
      preferred_face_types?: string[];
      preferred_skin_types?: string[];
      lifestyle_compatibility?: string;
      preferred_love_languages?: string[];
      personality_compatibility?: string;
      preferred_personality_traits?: string[];
      preferred_relationship_goals?: string[];
      preferred_communication_style?: string[];
      preferred_professions?: string[];
    };
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
  const [distance, setDistance] = React.useState<number | null>(null);
  const { profile: userProfile } = useProfileData();

  const images = profile.profile_images && profile.profile_images.length > 0
    ? profile.profile_images
    : [];
  const totalImages = images.length;

  // Reset image index when modal opens or profile changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [profile.user_id]);

  React.useEffect(() => {
    const calculateDist = async () => {
      try {
        const currentLoc = await getCurrentLocation();
        let profileLat, profileLon;
        try {
          const loc = JSON.parse(profile.location || '{}');
          profileLat = loc.latitude;
          profileLon = loc.longitude;
        } catch {
          return;
        }
        if (profileLat && profileLon) {
          const dist = calculateDistance(currentLoc.latitude, currentLoc.longitude, profileLat, profileLon);
          setDistance(dist);
        }
      } catch (error) {
        console.error('Error calculating distance:', error);
      }
    };
    if (profile.location) {
      calculateDist();
    }
  }, [profile.location]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const getInterestIcon = (interest: string) => {
    const iconMap: { [key: string]: any } = {
      'Reading': Book,
      'Music': Music,
      'Photography': Camera,
      'Gaming': Gamepad2,
      'Travel': Plane,
      'Fitness': Dumbbell,
      'Coffee': Coffee,
      'Sports': Dumbbell,
    };
    return iconMap[interest] || Star;
  };

  const formatArrayField = (arr: any, defaultValue: string = 'Not specified') => {
    if (!arr) return defaultValue;
    if (Array.isArray(arr)) return arr.length ? arr.join(', ') : defaultValue;
    if (typeof arr === 'string') {
      try {
        const parsed = JSON.parse(arr);
        if (Array.isArray(parsed)) return parsed.length ? parsed.join(', ') : defaultValue;
      } catch {}
      return arr.trim() || defaultValue;
    }
    return defaultValue;
  };

  const formatField = (value: any, defaultValue: string = 'Not specified') => {
    if (value === null || value === undefined || value === '') return defaultValue;
    return String(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-sm md:w-full md:max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-muted/20">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gradient-primary">
              {profile.first_name} {profile.last_name}
            </DialogTitle>
            <Button size="sm" onClick={onClose} className="bg-pink-500 text-white hover:bg-pink-600">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Images */}
          {totalImages > 0 && (
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-muted">
                <img
                  src={images[currentImageIndex]}
                  alt={`${profile.first_name}'s photo ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {totalImages > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="flex justify-center mt-2 space-x-1">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <Card className="bg-card/80 border border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-foreground">About</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Essential */}
          {profile.location && distance !== null && (
            <Card className="bg-card/80 border border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-foreground">Essential</h3>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{distance} km away</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          {Array.isArray(profile.interests) && profile.interests.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-center text-foreground">Interests</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.interests.map((interest, index) => {
                  const IconComponent = getInterestIcon(interest);
                  return (
                    <Badge
                      key={index}
                      variant="outline"
                      className="py-2 px-3 bg-card/70 border-border/50 text-foreground hover:scale-105 transition-transform"
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {interest}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* FULL WHO YOU ARE SECTION */}
          <div className="space-y-4">
            <h3 className="font-semibold text-center text-foreground text-lg border-b border-border/50 pb-2">
              Who You Are
            </h3>

            {/* Personal Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card className="bg-card/80 border border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Full Name:</span>
                      <span className="font-medium text-foreground">{profile.first_name} {profile.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Age:</span>
                      <span className="font-medium text-foreground">{formatField(profile.age)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">University:</span>
                      <span className="font-medium text-foreground">{profile.university}</span>
                    </div>
                    {profile.field_of_study && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Field of Study:</span>
                        <span className="font-medium text-foreground">{profile.field_of_study}</span>
                      </div>
                    )}
                    {profile.profession && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Profession:</span>
                        <span className="font-medium text-foreground">{profile.profession}</span>
                      </div>
                    )}
                    {profile.profession_description && (
                      <div className="flex flex-col gap-1">
                        <span className="text-foreground/70">About Profession:</span>
                        <span className="font-medium text-foreground text-xs">{profile.profession_description}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Academic & Professional */}
              <Card className="bg-card/80 border border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-3 flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Academic & Professional
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Education Level:</span>
                      <span className="font-medium text-foreground">{formatField(profile.education_level)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">QCS Score:</span>
                      <span className="font-medium text-foreground">{formatField(profile.total_qcs)}</span>
                    </div>
                    {profile.location && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Location:</span>
                        <span className="font-medium text-foreground">{profile.location}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Profile Completeness:</span>
                      <span className="font-medium text-foreground">{formatField(profile.profile_completeness)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Physical & Appearance */}
            <Card className="bg-card/80 border border-border/50">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <Heart className="w-4 h-4 mr-2" />
                  Physical & Appearance
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {profile.height && (
                    <div className="text-center">
                      <span className="text-foreground/70 block">Height</span>
                      <span className="font-medium text-foreground">{profile.height} cm</span>
                    </div>
                  )}
                  {profile.body_type && (
                    <div className="text-center">
                      <span className="text-foreground/70 block">Body Type</span>
                      <span className="font-medium text-foreground">{profile.body_type}</span>
                    </div>
                  )}
                  {profile.face_type && (
                    <div className="text-center">
                      <span className="text-foreground/70 block">Face Type</span>
                      <span className="font-medium text-foreground">{profile.face_type}</span>
                    </div>
                  )}
                  {profile.skin_tone && (
                    <div className="text-center">
                      <span className="text-foreground/70 block">Skin Tone</span>
                      <span className="font-medium text-foreground">{profile.skin_tone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Personality & Lifestyle - With Compatibility Badges */}
            <Card className="bg-card/80 border border-border/50">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-4 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  Personality & Lifestyle
                  <span className="ml-2 text-xs text-muted-foreground">(Only Matches Shown)</span>
                </h4>
                <div className="space-y-4">
                  {/* Personality Type Match */}
                  {profile.personality_type && (
                    <CompatibilityGroup
                      title="Personality"
                      icon={<User className="w-4 h-4" />}
                      items={[
                        {
                          label: profile.personality_type,
                          userValue: userProfile?.personality_type,
                          partnerValue: profile.personality_type,
                          type: 'personality'
                        }
                      ]}
                    />
                  )}

                  {/* Personality Traits Match */}
                  {Array.isArray(profile.personality_traits) && profile.personality_traits.length > 0 && (
                    <CompatibilityGroup
                      title="Traits"
                      icon={<Star className="w-4 h-4" />}
                      items={profile.personality_traits.map((trait: string) => ({
                        label: trait,
                        userValue: userProfile?.personality_traits,
                        partnerValue: trait,
                        type: 'personality'
                      }))}
                    />
                  )}

                  {/* Lifestyle Match */}
                  {profile.lifestyle && (
                    <CompatibilityGroup
                      title="Lifestyle"
                      icon={<Activity className="w-4 h-4" />}
                      items={[
                        {
                          label: profile.lifestyle,
                          userValue: userProfile?.lifestyle,
                          partnerValue: profile.lifestyle,
                          type: 'lifestyle'
                        }
                      ]}
                    />
                  )}

                  {/* Values Match */}
                  {(() => {
                    const valuesArray = Array.isArray(profile.values) 
                      ? profile.values 
                      : typeof profile.values === 'string' 
                        ? profile.values.split(',').map(v => v.trim()).filter(Boolean)
                        : [];
                    
                    return valuesArray.length > 0 && (
                      <CompatibilityGroup
                        title="Values"
                        icon={<Heart className="w-4 h-4" />}
                        items={valuesArray.slice(0, 3).map((value: string) => ({
                          label: value,
                          userValue: userProfile?.values,
                          partnerValue: value,
                          type: 'value'
                        }))}
                      />
                    );
                  })()}

                  {/* Mindset Match */}
                  {(() => {
                    const mindsetArray = Array.isArray(profile.mindset) 
                      ? profile.mindset 
                      : typeof profile.mindset === 'string' 
                        ? profile.mindset.split(',').map(v => v.trim()).filter(Boolean)
                        : [];
                    
                    return mindsetArray.length > 0 && (
                      <CompatibilityGroup
                        title="Mindset"
                        icon={<Brain className="w-4 h-4" />}
                        items={mindsetArray.map((mindset: string) => ({
                          label: mindset,
                          userValue: userProfile?.mindset,
                          partnerValue: mindset,
                          type: 'value'
                        }))}
                      />
                    );
                  })()}

                  {/* Additional Info - Only if matched */}
                  <div className="pt-3 border-t border-border/50 space-y-2">
                    {profile.love_language && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/70">Love Language:</span>
                        <CompatibilityBadge
                          label={profile.love_language}
                          userValue={userProfile?.love_language}
                          partnerValue={profile.love_language}
                        />
                      </div>
                    )}
                    {profile.communication_style && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/70">Communication:</span>
                        <CompatibilityBadge
                          label={profile.communication_style}
                          userValue={(userProfile as any)?.communication_style}
                          partnerValue={profile.communication_style}
                        />
                      </div>
                    )}
                    {profile.relationship_goals && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-sm text-foreground/70 w-full">Relationship Goals:</span>
                        {(Array.isArray(profile.relationship_goals) 
                          ? profile.relationship_goals 
                          : [profile.relationship_goals]
                        ).map((goal: string, idx: number) => (
                          <CompatibilityBadge
                            key={idx}
                            label={goal}
                            userValue={userProfile?.relationship_goals}
                            partnerValue={goal}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* No matches message */}
                  {(() => {
                    const valuesArray = Array.isArray(profile.values) 
                      ? profile.values 
                      : typeof profile.values === 'string' 
                        ? profile.values.split(',').map(v => v.trim()).filter(Boolean)
                        : [];
                    const mindsetArray = Array.isArray(profile.mindset) 
                      ? profile.mindset 
                      : typeof profile.mindset === 'string' 
                        ? profile.mindset.split(',').map(v => v.trim()).filter(Boolean)
                        : [];
                    
                    return !profile.personality_type && 
                      (!profile.personality_traits || profile.personality_traits.length === 0) && 
                      !profile.lifestyle && 
                      valuesArray.length === 0 && 
                      mindsetArray.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No matching personality or lifestyle traits found
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            {profile.preferences && (
              <Card className="bg-card/80 border border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Preferences
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Age Range */}
                    {(profile.preferences.age_range_min || profile.preferences.age_range_max) && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Age Range:</span>
                        <span className="font-medium text-foreground">
                          {profile.preferences.age_range_min || 'Any'} - {profile.preferences.age_range_max || 'Any'}
                        </span>
                      </div>
                    )}

                    {/* Height Range */}
                    {(profile.preferences.height_range_min || profile.preferences.height_range_max) && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Height Range:</span>
                        <span className="font-medium text-foreground">
                          {profile.preferences.height_range_min || 'Any'} - {profile.preferences.height_range_max || 'Any'} cm
                        </span>
                      </div>
                    )}

                    {/* Preferred Gender */}
                    {profile.preferences.preferred_gender && profile.preferences.preferred_gender.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Preferred Gender:</span>
                        <span className="font-medium text-foreground">{formatArrayField(profile.preferences.preferred_gender)}</span>
                      </div>
                    )}

                    {/* Preferred Values */}
                    {profile.preferences.preferred_values && profile.preferences.preferred_values.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Preferred Values:</span>
                        <span className="font-medium text-foreground">{formatArrayField(profile.preferences.preferred_values)}</span>
                      </div>
                    )}

                    {/* Preferred Mindset */}
                    {profile.preferences.preferred_mindset && profile.preferences.preferred_mindset.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Preferred Mindset:</span>
                        <span className="font-medium text-foreground">{formatArrayField(profile.preferences.preferred_mindset)}</span>
                      </div>
                    )}

                    {/* Preferred Lifestyle */}
                    {profile.preferences.preferred_lifestyle && profile.preferences.preferred_lifestyle.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Preferred Lifestyle:</span>
                        <span className="font-medium text-foreground">{formatArrayField(profile.preferences.preferred_lifestyle)}</span>
                      </div>
                    )}

                    {/* Preferred Love Languages */}
                    {profile.preferences.preferred_love_languages && profile.preferences.preferred_love_languages.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Preferred Love Languages:</span>
                        <span className="font-medium text-foreground">{formatArrayField(profile.preferences.preferred_love_languages)}</span>
                      </div>
                    )}

                    {/* Preferred Personality Traits */}
                    {profile.preferences.preferred_personality_traits && profile.preferences.preferred_personality_traits.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Preferred Personality Traits:</span>
                        <span className="font-medium text-foreground">{formatArrayField(profile.preferences.preferred_personality_traits)}</span>
                      </div>
                    )}

                    {/* Preferred Relationship Goals */}
                    {profile.preferences.preferred_relationship_goals && profile.preferences.preferred_relationship_goals.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Preferred Relationship Goals:</span>
                        <span className="font-medium text-foreground">{formatArrayField(profile.preferences.preferred_relationship_goals)}</span>
                      </div>
                    )}

                    {/* Preferred Professions */}
                    {profile.preferences.preferred_professions && profile.preferences.preferred_professions.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Preferred Professions:</span>
                        <span className="font-medium text-foreground">{formatArrayField(profile.preferences.preferred_professions)}</span>
                      </div>
                    )}

                    {/* Min Shared Interests */}
                    {profile.preferences.min_shared_interests && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Min Shared Interests:</span>
                        <span className="font-medium text-foreground">{profile.preferences.min_shared_interests}</span>
                      </div>
                    )}

                    {/* Lifestyle Compatibility */}
                    {profile.preferences.lifestyle_compatibility && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Lifestyle Compatibility:</span>
                        <span className="font-medium text-foreground">{profile.preferences.lifestyle_compatibility}</span>
                      </div>
                    )}

                    {/* Personality Compatibility */}
                    {profile.preferences.personality_compatibility && (
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Personality Compatibility:</span>
                        <span className="font-medium text-foreground">{profile.preferences.personality_compatibility}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compatibility Scores */}
            {(profile.compatibility_score || profile.physical_score || profile.mental_score) && (
              <Card className="bg-card/80 border border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Compatibility Analysis
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {profile.compatibility_score !== undefined && (
                      <div>
                        <div className="text-2xl font-bold text-primary">{profile.compatibility_score}%</div>
                        <div className="text-xs text-muted-foreground">Overall Match</div>
                      </div>
                    )}
                    {profile.physical_score !== undefined && (
                      <div>
                        <div className="text-2xl font-bold text-green-500">{profile.physical_score}%</div>
                        <div className="text-xs text-muted-foreground">Physical</div>
                      </div>
                    )}
                    {profile.mental_score !== undefined && (
                      <div>
                        <div className="text-2xl font-bold text-blue-500">{profile.mental_score}%</div>
                        <div className="text-xs text-muted-foreground">Mental</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => onChatRequest?.(profile.user_id, profile.can_chat)}
              className="flex-1 bg-gradient-primary hover:opacity-90"
              disabled={!profile.can_chat}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {profile.can_chat ? 'Send Message' : 'Chat Unavailable'}
            </Button>
            {onSwipe && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onSwipe('left')}
                  className="px-6 border-red-300 text-red-600 hover:bg-red-50"
                >
                  Pass
                </Button>
                <Button
                  onClick={() => onSwipe('right')}
                  className="px-6 bg-green-500 hover:bg-green-600"
                >
                  Like
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedProfileModal;
