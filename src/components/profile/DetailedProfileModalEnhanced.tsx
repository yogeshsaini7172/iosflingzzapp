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
  Activity
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
    // New fields from database
    values?: string[];
    mindset?: string[];
    body_type?: string;
    face_type?: string;
    lifestyle?: string;
    skin_tone?: string;
    bio_length?: number;
    profession?: string | null;
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

  const images = profile.profile_images && profile.profile_images.length > 0
    ? profile.profile_images
    : [];
  const totalImages = images.length;

  // Reset image index when modal opens or profile changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [profile.user_id]);

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

  // Helper to ensure array fields are always arrays
  const ensureArray = (value: any): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return [];
  };

  // Helper to filter items based on matched criteria - ONLY show matched items
  const getMatchedItems = (items: any[], fieldPrefix?: string): any[] => {
    // If no matched_criteria exists, show nothing (not everything)
    if (!profile.matched_criteria || profile.matched_criteria.length === 0) {
      return [];
    }
    
    const itemsArray = ensureArray(items);
    if (itemsArray.length === 0) return [];
    
    // Filter items that appear in matched_criteria
    return itemsArray.filter(item => {
      const itemLower = String(item).toLowerCase().replace(/\s+/g, '_');
      return profile.matched_criteria?.some(criteria => {
        const criteriaLower = criteria.toLowerCase();
        // Check if the criteria contains the item or vice versa
        return criteriaLower.includes(itemLower) || itemLower.includes(criteriaLower);
      });
    });
  };

  // Check if a single field value is matched
  const isFieldMatched = (fieldValue: any, fieldName?: string): boolean => {
    if (!profile.matched_criteria || profile.matched_criteria.length === 0) {
      return false;
    }
    if (!fieldValue) return false;
    
    const valueLower = String(fieldValue).toLowerCase().replace(/\s+/g, '_');
    return profile.matched_criteria.some(criteria => {
      const criteriaLower = criteria.toLowerCase();
      return criteriaLower.includes(valueLower) || valueLower.includes(criteriaLower);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-muted/20">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gradient-primary">
              {profile.first_name} {profile.last_name}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
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

          {/* About & Qualities Section */}
          <Card className="bg-card/80 border border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 text-foreground text-lg">About & Qualities</h3>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-4">
                  <h4 className="font-medium text-foreground mb-2">Bio</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Core Qualities Grid - ONLY MATCHED */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Values - Only Matched */}
                {getMatchedItems(profile.values).length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Values (Matched)</h4>
                    <div className="flex flex-wrap gap-1">
                      {getMatchedItems(profile.values).map((value, index) => (
                        <Badge key={index} variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                          ✓ {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mindset - Only Matched */}
                {getMatchedItems(profile.mindset).length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Mindset (Matched)</h4>
                    <div className="flex flex-wrap gap-1">
                      {getMatchedItems(profile.mindset).map((mindset, index) => (
                        <Badge key={index} variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                          ✓ {mindset}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personality Type - Only if matched */}
                {profile.personality_type && isFieldMatched(profile.personality_type) && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Personality Type (Matched)</h4>
                    <Badge variant="default" className="text-sm bg-green-600 hover:bg-green-700">
                      ✓ {profile.personality_type}
                    </Badge>
                  </div>
                )}

                {/* Love Language - Only if matched */}
                {profile.love_language && isFieldMatched(profile.love_language) && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Love Language (Matched)</h4>
                    <Badge variant="default" className="text-sm bg-green-600 hover:bg-green-700">
                      ✓ {profile.love_language}
                    </Badge>
                  </div>
                )}

                {/* Communication Style - Only if matched */}
                {profile.communication_style && isFieldMatched(profile.communication_style) && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Communication Style (Matched)</h4>
                    <Badge variant="default" className="text-sm bg-green-600 hover:bg-green-700">
                      ✓ {profile.communication_style}
                    </Badge>
                  </div>
                )}

                {/* Lifestyle - Only if matched */}
                {profile.lifestyle && isFieldMatched(profile.lifestyle) && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Lifestyle (Matched)</h4>
                    <Badge variant="default" className="text-sm bg-green-600 hover:bg-green-700">
                      ✓ {profile.lifestyle}
                    </Badge>
                  </div>
                )}

                {/* Profile Completeness */}
                {profile.profile_completeness && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Profile Completeness</h4>
                    <Badge variant="outline" className="text-sm">
                      {profile.profile_completeness}
                    </Badge>
                  </div>
                )}

                {/* Bio Length */}
                {profile.bio_length && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Bio Length</h4>
                    <Badge variant="outline" className="text-sm">
                      {profile.bio_length} characters
                    </Badge>
                  </div>
                )}
              </div>

              {/* Personality Traits - Only Matched */}
              {getMatchedItems(profile.personality_traits).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-foreground mb-2">Personality Traits (Matched)</h4>
                  <div className="flex flex-wrap gap-1">
                    {getMatchedItems(profile.personality_traits).map((trait, index) => (
                      <Badge key={index} variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                        ✓ {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests - Only Matched */}
              {getMatchedItems(profile.interests).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-foreground mb-2">Interests (Matched)</h4>
                  <div className="flex flex-wrap gap-1">
                    {getMatchedItems(profile.interests).map((interest, index) => {
                      const IconComponent = getInterestIcon(interest);
                      return (
                        <Badge
                          key={index}
                          variant="default"
                          className="py-1 px-2 bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-transform"
                        >
                          <IconComponent className="w-3 h-3 mr-1" />
                          ✓ {interest}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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

            {/* Personality & Lifestyle */}
            <Card className="bg-card/80 border border-border/50">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  Personality & Lifestyle
                </h4>
                <div className="space-y-3 text-sm">
                  {profile.personality_type && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Personality Type:</span>
                      <span className="font-medium text-foreground">{profile.personality_type}</span>
                    </div>
                  )}
                  {profile.personality_traits && profile.personality_traits.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Personality Traits:</span>
                      <span className="font-medium text-foreground">{formatArrayField(profile.personality_traits)}</span>
                    </div>
                  )}
                  {profile.lifestyle && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Lifestyle:</span>
                      <span className="font-medium text-foreground">{profile.lifestyle}</span>
                    </div>
                  )}
                  {profile.love_language && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Love Language:</span>
                      <span className="font-medium text-foreground">{profile.love_language}</span>
                    </div>
                  )}
                  {profile.communication_style && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Communication Style:</span>
                      <span className="font-medium text-foreground">{profile.communication_style}</span>
                    </div>
                  )}
                  {profile.values && profile.values.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Values:</span>
                      <span className="font-medium text-foreground">{formatArrayField(profile.values)}</span>
                    </div>
                  )}
                  {profile.mindset && profile.mindset.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Mindset:</span>
                      <span className="font-medium text-foreground">{formatArrayField(profile.mindset)}</span>
                    </div>
                  )}
                  {profile.relationship_goals && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Relationship Goals:</span>
                      <span className="font-medium text-foreground">
                        {Array.isArray(profile.relationship_goals)
                          ? formatArrayField(profile.relationship_goals)
                          : profile.relationship_goals}
                      </span>
                    </div>
                  )}
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
                    {profile.compatibility_score && (
                      <div>
                        <div className="text-2xl font-bold text-primary">{profile.compatibility_score}%</div>
                        <div className="text-xs text-muted-foreground">Overall Match</div>
                      </div>
                    )}
                    {profile.physical_score && (
                      <div>
                        <div className="text-2xl font-bold text-green-500">{profile.physical_score}%</div>
                        <div className="text-xs text-muted-foreground">Physical</div>
                      </div>
                    )}
                    {profile.mental_score && (
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
