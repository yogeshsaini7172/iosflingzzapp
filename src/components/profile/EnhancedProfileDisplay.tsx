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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="genZ-glass-card p-6 rounded-3xl border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <h2 className="text-3xl font-elegant font-bold text-gradient-royal">
                Your Profile
              </h2>
              <div className="absolute -top-1 -right-3 text-lg animate-bounce-slow">✨</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={toggleProfileVisibility}
              variant="outline"
              size="sm"
              className={`border-white/20 ${
                profileData.is_profile_public 
                  ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                  : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
              }`}
            >
              {profileData.is_profile_public ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              {profileData.is_profile_public ? 'Public' : 'Private'}
            </Button>
            
            <Button variant="outline" size="sm" className="border-white/20 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Verification & QCS Status */}
        <div className="flex items-center space-x-3 mb-4">
          <Badge className={`${
            profileData.verification_status === 'verified' 
              ? 'bg-green-500/20 text-green-300 border-green-400/30' 
              : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
          }`}>
            <Shield className="w-3 h-3 mr-1" />
            {profileData.verification_status === 'verified' ? 'Verified' : 'Pending Verification'}
          </Badge>
          
          {profileData.total_qcs && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
              <Brain className="w-3 h-3 mr-1" />
              QCS: {profileData.total_qcs}
            </Badge>
          )}
          
          <Badge className={`${
            profileData.subscription_tier === 'premium' 
              ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-black' 
              : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
          }`}>
            <Star className="w-3 h-3 mr-1" />
            {profileData.subscription_tier || 'Free'} Member
          </Badge>
        </div>
      </div>

      {/* Main Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo & Basic Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Photo */}
          <div className="genZ-glass-card p-6 rounded-3xl border border-white/20">
            <div className="relative">
              <div className="aspect-[3/4] bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl overflow-hidden border border-white/10">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={`${profileData.first_name}'s photo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Camera className="w-12 h-12 text-white/50 mx-auto" />
                      <p className="text-white/60 text-sm">No photo uploaded</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Navigation */}
              {profileData.profile_images && profileData.profile_images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevImage}
                    className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full w-8 h-8 p-0"
                  >
                    ‹
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextImage}
                    className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full w-8 h-8 p-0"
                  >
                    ›
                  </Button>
                </div>
              )}

              {/* Photo Indicators */}
              {profileData.profile_images && profileData.profile_images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {profileData.profile_images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex 
                          ? 'bg-white scale-125' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white">
                  {profileData.first_name} {profileData.last_name}
                </h3>
                <p className="text-white/70 text-lg">{age} years old</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">{profileData.university}</p>
                    {profileData.field_of_study && (
                      <p className="text-white/60 text-sm">{profileData.field_of_study}</p>
                    )}
                  </div>
                </div>

                {profileData.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-pink-400" />
                    <p className="text-white">{profileData.location}</p>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-red-400" />
                  <p className="text-white capitalize">{profileData.gender}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Me */}
          {profileData.bio && (
            <div className="genZ-glass-card p-6 rounded-3xl border border-white/20">
              <h4 className="text-xl font-bold text-gradient-primary mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                About Me
              </h4>
              <p className="text-white/90 leading-relaxed italic">
                "{profileData.bio}"
              </p>
            </div>
          )}

          {/* Interests */}
          {profileData.interests && profileData.interests.length > 0 && (
            <div className="genZ-glass-card p-6 rounded-3xl border border-white/20">
              <h4 className="text-xl font-bold text-gradient-primary mb-4">
                My Interests ✨
              </h4>
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest, index) => (
                  <Badge 
                    key={index} 
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 py-1 px-3 hover:scale-105 transition-transform"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Relationship Goals */}
          {profileData.relationship_goals && profileData.relationship_goals.length > 0 && (
            <div className="genZ-glass-card p-6 rounded-3xl border border-white/20">
              <h4 className="text-xl font-bold text-gradient-secondary mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Relationship Goals
              </h4>
              <div className="flex flex-wrap gap-2">
                {profileData.relationship_goals.map((goal, index) => (
                  <Badge 
                    key={index} 
                    className="bg-pink-500/20 text-pink-300 border-pink-400/30 py-1 px-3"
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Personality & Traits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileData.personality_type && (
              <div className="genZ-glass-card p-4 rounded-2xl border border-white/20">
                <h5 className="font-semibold text-white mb-2">Personality</h5>
                <p className="text-white/80">{profileData.personality_type}</p>
              </div>
            )}

            {profileData.values && (
              <div className="genZ-glass-card p-4 rounded-2xl border border-white/20">
                <h5 className="font-semibold text-white mb-2">Values</h5>
                <p className="text-white/80">{profileData.values}</p>
              </div>
            )}

            {profileData.humor_type && (
              <div className="genZ-glass-card p-4 rounded-2xl border border-white/20">
                <h5 className="font-semibold text-white mb-2">Humor Style</h5>
                <p className="text-white/80">{profileData.humor_type}</p>
              </div>
            )}

            {profileData.love_language && (
              <div className="genZ-glass-card p-4 rounded-2xl border border-white/20">
                <h5 className="font-semibold text-white mb-2">Love Language</h5>
                <p className="text-white/80">{profileData.love_language}</p>
              </div>
            )}
          </div>

          {/* Partner Preferences */}
          {preferences && (
            <div className="genZ-glass-card p-6 rounded-3xl border border-white/20">
              <h4 className="text-xl font-bold text-gradient-royal mb-4 flex items-center">
                <Coffee className="w-5 h-5 mr-2" />
                Looking For
              </h4>
              <div className="space-y-4">
                {preferences.preferred_gender && preferences.preferred_gender.length > 0 && (
                  <div>
                    <p className="text-white/70 text-sm mb-2">Gender:</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences.preferred_gender.map((gender, index) => (
                        <Badge key={index} className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                          {gender}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(preferences.age_range_min || preferences.age_range_max) && (
                  <div>
                    <p className="text-white/70 text-sm mb-2">Age Range:</p>
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                      {preferences.age_range_min || 18} - {preferences.age_range_max || 30} years
                    </Badge>
                  </div>
                )}

                {preferences.preferred_relationship_goal && preferences.preferred_relationship_goal.length > 0 && (
                  <div>
                    <p className="text-white/70 text-sm mb-2">Seeking:</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences.preferred_relationship_goal.map((goal, index) => (
                        <Badge key={index} className="bg-pink-500/20 text-pink-300 border-pink-400/30">
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