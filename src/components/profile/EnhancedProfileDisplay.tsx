import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Heart, 
  MapPin, 
  GraduationCap, 
  Calendar,
  Edit3,
  Camera,
  Star,
  Brain,
  Shield,
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  Target,
  Coffee
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  university: string;
  year_of_study?: number;
  field_of_study?: string;
  bio?: string;
  height?: number;
  body_type?: string;
  skin_tone?: string;
  personality_type?: string;
  values?: string;
  mindset?: string;
  relationship_goals?: string[];
  interests?: string[];
  profile_images?: string[];
  verification_status?: string;
  total_qcs?: number;
  subscription_tier?: string;
  is_profile_public?: boolean;
  location?: string;
  humor_type?: string;
  love_language?: string;
}

interface PartnerPreferences {
  preferred_gender?: string[];
  age_range_min?: number;
  age_range_max?: number;
  height_range_min?: number;
  height_range_max?: number;
  preferred_body_types?: string[];
  preferred_values?: string[];
  preferred_mindset?: string[];
  preferred_personality?: string[];
  preferred_relationship_goal?: string[];
}

const EnhancedProfileDisplay: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const currentUserId = localStorage.getItem("demoUserId");
      
      if (!currentUserId) {
        toast({
          title: "No user selected",
          description: "Please select a user to view profile",
          variant: "destructive"
        });
        return;
      }

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (profileError) throw profileError;

      // Fetch partner preferences
      const { data: prefs, error: prefsError } = await supabase
        .from('partner_preferences')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      // Don't throw error if preferences not found, it's optional
      setProfileData(profile);
      setPreferences(prefs || null);

    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProfileVisibility = async () => {
    if (!profileData) return;

    try {
      const newVisibility = !profileData.is_profile_public;
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_profile_public: newVisibility })
        .eq('user_id', profileData.user_id);

      if (error) throw error;

      setProfileData(prev => prev ? { ...prev, is_profile_public: newVisibility } : null);
      
      toast({
        title: newVisibility ? "Profile is now public ✨" : "Profile is now private 🔒",
        description: newVisibility ? "Others can discover your profile" : "Your profile is hidden from discovery"
      });
    } catch (error: any) {
      toast({
        title: "Error updating visibility",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const nextImage = () => {
    if (profileData?.profile_images && profileData.profile_images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % profileData.profile_images!.length);
    }
  };

  const prevImage = () => {
    if (profileData?.profile_images && profileData.profile_images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + profileData.profile_images!.length) % profileData.profile_images!.length);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/70">Loading your amazing profile... ✨</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center space-y-6 py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto border border-purple-400/30">
          <User className="w-10 h-10 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2 text-white">Profile Not Found</h3>
          <p className="text-white/70">Please select a user to view their profile ✨</p>
        </div>
      </div>
    );
  }

  const profileImage = profileData.profile_images?.[currentImageIndex];
  const age = calculateAge(profileData.date_of_birth);

  return (
    <div className="space-y-3 w-full">
      {/* Header Section - Mobile */}
      <div className="genZ-glass-card p-3 rounded-2xl border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <h2 className="text-lg font-elegant font-bold text-gradient-royal">
                Your Profile
              </h2>
              <div className="absolute -top-0.5 -right-2 text-sm animate-bounce-slow">✨</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleProfileVisibility}
              variant="outline"
              size="sm"
              className={`border-white/20 text-xs px-2 py-1 h-7 ${
                profileData.is_profile_public 
                  ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                  : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
              }`}
            >
              {profileData.is_profile_public ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              {profileData.is_profile_public ? 'Public' : 'Private'}
            </Button>
            
            <Button variant="outline" size="sm" className="border-white/20 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs px-2 py-1 h-7">
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Verification & QCS Status - Mobile */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge className={`text-xs px-2 py-0.5 ${
            profileData.verification_status === 'verified' 
              ? 'bg-green-500/20 text-green-300 border-green-400/30' 
              : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
          }`}>
            <Shield className="w-2 h-2 mr-1" />
            {profileData.verification_status === 'verified' ? 'Verified' : 'Pending'}
          </Badge>
          
          {profileData.total_qcs && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs px-2 py-0.5">
              <Brain className="w-2 h-2 mr-1" />
              QCS: {profileData.total_qcs}
            </Badge>
          )}
          
          <Badge className={`text-xs px-2 py-0.5 ${
            profileData.subscription_tier === 'premium' 
              ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-black' 
              : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
          }`}>
            <Star className="w-2 h-2 mr-1" />
            {profileData.subscription_tier || 'Free'}
          </Badge>
        </div>
      </div>

      {/* Main Profile Content - Mobile Layout */}
      <div className="space-y-3">
        {/* Profile Photo & Basic Info - Mobile */}
        <div className="space-y-3">
          {/* Profile Photo - Mobile */}
          <div className="genZ-glass-card p-3 rounded-2xl border border-white/20">
            <div className="relative">
              <div className="aspect-[3/4] bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl overflow-hidden border border-white/10 max-w-xs mx-auto">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={`${profileData.first_name}'s photo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Camera className="w-8 h-8 text-white/50 mx-auto" />
                      <p className="text-white/60 text-xs">No photo</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Navigation - Mobile */}
              {profileData.profile_images && profileData.profile_images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevImage}
                    className="bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm rounded-full w-6 h-6 p-0 text-sm"
                  >
                    ‹
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextImage}
                    className="bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm rounded-full w-6 h-6 p-0 text-sm"
                  >
                    ›
                  </Button>
                </div>
              )}

              {/* Photo Indicators - Mobile */}
              {profileData.profile_images && profileData.profile_images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {profileData.profile_images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentImageIndex 
                          ? 'bg-white scale-125' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Basic Info - Mobile */}
            <div className="mt-3 space-y-3">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">
                  {profileData.first_name} {profileData.last_name}
                </h3>
                <p className="text-white/70 text-sm">{age} years old</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{profileData.university}</p>
                    {profileData.field_of_study && (
                      <p className="text-white/60 text-xs truncate">{profileData.field_of_study}</p>
                    )}
                    {profileData.year_of_study && (
                      <p className="text-white/60 text-xs">Year {profileData.year_of_study}</p>
                    )}
                  </div>
                </div>

                {profileData.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-pink-400" />
                    <p className="text-white text-sm truncate">{profileData.location}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <p className="text-white capitalize text-sm">{profileData.gender}</p>
                </div>

                {profileData.height && (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <span className="text-green-400 text-xs">📏</span>
                    </div>
                    <p className="text-white text-sm">{profileData.height} cm</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* About Me - Mobile */}
          {profileData.bio && (
            <div className="genZ-glass-card p-3 rounded-2xl border border-white/20">
              <h4 className="text-lg font-bold text-gradient-primary mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                About Me
              </h4>
              <p className="text-white/90 leading-relaxed italic text-sm">
                "{profileData.bio}"
              </p>
            </div>
          )}

          {/* Interests - Mobile */}
          {profileData.interests && profileData.interests.length > 0 && (
            <div className="genZ-glass-card p-3 rounded-2xl border border-white/20">
              <h4 className="text-lg font-bold text-gradient-primary mb-2">
                My Interests ✨
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profileData.interests.map((interest, index) => (
                  <Badge 
                    key={index} 
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 py-0.5 px-2 text-xs hover:scale-105 transition-transform"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Relationship Goals - Mobile */}
          {profileData.relationship_goals && profileData.relationship_goals.length > 0 && (
            <div className="genZ-glass-card p-3 rounded-2xl border border-white/20">
              <h4 className="text-lg font-bold text-gradient-secondary mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Relationship Goals
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profileData.relationship_goals.map((goal, index) => (
                  <Badge 
                    key={index} 
                    className="bg-pink-500/20 text-pink-300 border-pink-400/30 py-0.5 px-2 text-xs"
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Physical Attributes & Traits - Mobile */}
          <div className="genZ-glass-card p-3 rounded-2xl border border-white/20">
            <h4 className="text-lg font-bold text-gradient-secondary mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" />
              About Me Details
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {profileData.personality_type && (
                <div className="genZ-glass-card p-2 rounded-xl border border-white/20">
                  <h5 className="font-semibold text-white mb-1 flex items-center text-sm">
                    <Brain className="w-3 h-3 mr-1 text-purple-400" />
                    Personality
                  </h5>
                  <p className="text-white/80 capitalize text-xs">{profileData.personality_type.replace(/_/g, ' ')}</p>
                </div>
              )}

              {profileData.values && (
                <div className="genZ-glass-card p-2 rounded-xl border border-white/20">
                  <h5 className="font-semibold text-white mb-1 flex items-center text-sm">
                    <Heart className="w-3 h-3 mr-1 text-pink-400" />
                    Values
                  </h5>
                  <p className="text-white/80 capitalize text-xs">{profileData.values.replace(/_/g, ' ')}</p>
                </div>
              )}

              {profileData.mindset && (
                <div className="genZ-glass-card p-2 rounded-xl border border-white/20">
                  <h5 className="font-semibold text-white mb-1 flex items-center text-sm">
                    <Sparkles className="w-3 h-3 mr-1 text-blue-400" />
                    Mindset
                  </h5>
                  <p className="text-white/80 capitalize text-xs">{profileData.mindset.replace(/_/g, ' ')}</p>
                </div>
              )}

              {profileData.body_type && (
                <div className="genZ-glass-card p-2 rounded-xl border border-white/20">
                  <h5 className="font-semibold text-white mb-1 flex items-center text-sm">
                    <User className="w-3 h-3 mr-1 text-green-400" />
                    Body Type
                  </h5>
                  <p className="text-white/80 capitalize text-xs">{profileData.body_type.replace(/_/g, ' ')}</p>
                </div>
              )}

              {profileData.skin_tone && (
                <div className="genZ-glass-card p-2 rounded-xl border border-white/20">
                  <h5 className="font-semibold text-white mb-1 flex items-center text-sm">
                    <div className="w-3 h-3 mr-1 rounded-full bg-gradient-to-br from-amber-300 to-amber-600"></div>
                    Skin Tone
                  </h5>
                  <p className="text-white/80 capitalize text-xs">{profileData.skin_tone.replace(/_/g, ' ')}</p>
                </div>
              )}

              {profileData.humor_type && (
                <div className="genZ-glass-card p-2 rounded-xl border border-white/20">
                  <h5 className="font-semibold text-white mb-1 flex items-center text-sm">
                    <Coffee className="w-3 h-3 mr-1 text-yellow-400" />
                    Humor Style
                  </h5>
                  <p className="text-white/80 text-xs">{profileData.humor_type}</p>
                </div>
              )}

              {profileData.love_language && (
                <div className="genZ-glass-card p-2 rounded-xl border border-white/20">
                  <h5 className="font-semibold text-white mb-1 flex items-center text-sm">
                    <Heart className="w-3 h-3 mr-1 text-red-400" />
                    Love Language
                  </h5>
                  <p className="text-white/80 text-xs">{profileData.love_language}</p>
                </div>
              )}
            </div>
          </div>

          {/* Partner Preferences - Mobile */}
          {preferences && (
            <div className="genZ-glass-card p-3 rounded-2xl border border-white/20">
              <h4 className="text-lg font-bold text-gradient-royal mb-2 flex items-center">
                <Coffee className="w-4 h-4 mr-2" />
                Looking For
              </h4>
              <div className="space-y-2">
                {preferences.preferred_gender && preferences.preferred_gender.length > 0 && (
                  <div>
                    <p className="text-white/70 text-xs mb-1">Gender:</p>
                    <div className="flex flex-wrap gap-1">
                      {preferences.preferred_gender.map((gender, index) => (
                        <Badge key={index} className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs py-0.5 px-2">
                          {gender}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(preferences.age_range_min || preferences.age_range_max) && (
                  <div>
                    <p className="text-white/70 text-xs mb-1">Age Range:</p>
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs py-0.5 px-2">
                      {preferences.age_range_min || 18} - {preferences.age_range_max || 30} years
                    </Badge>
                  </div>
                )}

                {(preferences.height_range_min || preferences.height_range_max) && (
                  <div>
                    <p className="text-white/70 text-xs mb-1">Height Range:</p>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-xs py-0.5 px-2">
                      {preferences.height_range_min || 150} - {preferences.height_range_max || 200} cm
                    </Badge>
                  </div>
                )}

                {preferences.preferred_body_types && preferences.preferred_body_types.length > 0 && (
                  <div>
                    <p className="text-white/70 text-xs mb-1">Preferred Body Types:</p>
                    <div className="flex flex-wrap gap-1">
                      {preferences.preferred_body_types.map((type, index) => (
                        <Badge key={index} className="bg-orange-500/20 text-orange-300 border-orange-400/30 text-xs py-0.5 px-2">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.preferred_values && preferences.preferred_values.length > 0 && (
                  <div>
                    <p className="text-white/70 text-xs mb-1">Preferred Values:</p>
                    <div className="flex flex-wrap gap-1">
                      {preferences.preferred_values.map((value, index) => (
                        <Badge key={index} className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs py-0.5 px-2">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.preferred_mindset && preferences.preferred_mindset.length > 0 && (
                  <div>
                    <p className="text-white/70 text-xs mb-1">Preferred Mindset:</p>
                    <div className="flex flex-wrap gap-1">
                      {preferences.preferred_mindset.map((mindset, index) => (
                        <Badge key={index} className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-xs py-0.5 px-2">
                          {mindset}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.preferred_personality && preferences.preferred_personality.length > 0 && (
                  <div>
                    <p className="text-white/70 text-xs mb-1">Preferred Personality:</p>
                    <div className="flex flex-wrap gap-1">
                      {preferences.preferred_personality.map((personality, index) => (
                        <Badge key={index} className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs py-0.5 px-2">
                          {personality}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.preferred_relationship_goal && preferences.preferred_relationship_goal.length > 0 && (
                  <div>
                    <p className="text-white/70 text-xs mb-1">Seeking:</p>
                    <div className="flex flex-wrap gap-1">
                      {preferences.preferred_relationship_goal.map((goal, index) => (
                        <Badge key={index} className="bg-pink-500/20 text-pink-300 border-pink-400/30 text-xs py-0.5 px-2">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfileDisplay;