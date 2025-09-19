import { useState, useEffect } from 'react';
import GenZBackground from '@/components/ui/genZ-background';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, 
  Camera, 
  Star, 
  MapPin, 
  Calendar, 
  Heart,
  Shield,
  Sparkles,
  Edit3,
  Eye,
  User,
  Users,
  Target,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Move,
  X,
  MoreHorizontal
} from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedProfileManagementProps {
  onNavigate: (view: string) => void;
}

const EnhancedProfileManagement = ({ onNavigate }: EnhancedProfileManagementProps) => {
  // Remove photo from profileImages
  const removePhoto = (index: number) => {
    const newImages = (formData.profileImages || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, profileImages: newImages }));
    // Optionally, auto-save after removal
    updateProfile({ profile_images: newImages });
  };
  const { profile, preferences, isLoading, updateProfile, updatePreferences } = useProfileData();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'basic' | 'what-you-are' | 'who-you-want' | 'photos' | 'privacy'>('basic');
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  // Helper function to get current user ID
  const getCurrentUserId = () => {
    if (!user?.uid) {
      throw new Error('User must be authenticated to access profile');
    }
    return user.uid;
  };

  // Local state for form management - Initialize with empty values initially
  const [formData, setFormData] = useState({
    // Basic info
    firstName: '',
    lastName: '',
    bio: '',
    educationLevel: '',
    profession: '',
    
    // Physical Attributes
    height: '',
    bodyType: '',
    skinTone: '',
    
    // Personality & Values (arrays)
    personalityTraits: [] as string[],
    values: [] as string[],
    mindset: [] as string[],
    
    // Goals & Interests
    relationshipGoals: [] as string[],
    interests: [] as string[],
    
    // Who You Want data
    preferredGender: [] as string[],
    ageRangeMin: 18,
    ageRangeMax: 30,
    heightRangeMin: 150,
    heightRangeMax: 200,
    preferredBodyTypes: [] as string[],
    preferredValues: [] as string[],
    preferredMindset: [] as string[],
    preferredPersonalityTraits: [] as string[],
    preferredRelationshipGoal: [] as string[],
    preferredSkinTone: [] as string[],
    preferredFaceType: [] as string[],
    preferredLoveLanguage: [] as string[],
    preferredLifestyle: [] as string[],
    
    // Settings
    isVisible: true,
    profileImages: [] as string[]
  });

  // Helper function to normalize keys to match UI format
  const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const normalizeArray = (arr: string[]) => arr.map(normalizeKey);

  // Update form data when profile/preferences load
  useEffect(() => {
    if (profile) {
      console.log("📊 Loading profile data into form:", profile);
      console.log("🔍 Raw profile values:", {
        personality_traits: profile.personality_traits,
        values: profile.values,
        values_array: (profile as any).values_array,
        mindset: profile.mindset,
        relationship_goals: profile.relationship_goals
      });
      
      const transformedData = {
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        bio: profile.bio || '',
        educationLevel: profile.education_level || '',
        profession: profile.profession || '',
        height: profile.height?.toString() || '',
        bodyType: profile.body_type || '',
        skinTone: profile.skin_tone || '',
        personalityTraits: profile.personality_traits ? normalizeArray(profile.personality_traits) : [],
        values: profile.values ? normalizeArray(profile.values) : [],
        mindset: profile.mindset ? (Array.isArray(profile.mindset) ? normalizeArray(profile.mindset) : [normalizeKey(profile.mindset)]) : [],
        relationshipGoals: profile.relationship_goals ? normalizeArray(profile.relationship_goals) : [],
        interests: profile.interests ? normalizeArray(profile.interests) : [],
        isVisible: profile.show_profile !== false,
        profileImages: profile.profile_images || []
      };
      
      console.log("🔄 Transformed data:", transformedData);
      
      setFormData(prev => ({
        ...prev,
        ...transformedData
      }));
    }
    
    if (preferences) {
      console.log("📊 Loading preferences data into form:", preferences);
      setFormData(prev => ({
        ...prev,
        preferredGender: Array.isArray(preferences.preferred_gender) ? preferences.preferred_gender.map(g => g.toString().toLowerCase()) : ['male', 'female'], // Default to both genders
        ageRangeMin: preferences.age_range_min || 18,
        ageRangeMax: preferences.age_range_max || 30,
        heightRangeMin: preferences.height_range_min || 150,
        heightRangeMax: preferences.height_range_max || 200,
        preferredBodyTypes: Array.isArray(preferences.preferred_body_types) && preferences.preferred_body_types.length > 0 
          ? normalizeArray(preferences.preferred_body_types) 
          : ['slim', 'athletic', 'average'], // Provide sensible defaults
        preferredValues: Array.isArray(preferences.preferred_values) && preferences.preferred_values.length > 0 
          ? normalizeArray(preferences.preferred_values) 
          : ['family_oriented', 'career_focused'], // Default values
        preferredMindset: Array.isArray(preferences.preferred_mindset) && preferences.preferred_mindset.length > 0 
          ? normalizeArray(preferences.preferred_mindset) 
          : ['growth_mindset'], // Default mindset
        preferredPersonalityTraits: Array.isArray(preferences.preferred_personality_traits) && preferences.preferred_personality_traits.length > 0 
          ? normalizeArray(preferences.preferred_personality_traits) 
          : ['outgoing', 'empathetic'], // Default traits
        preferredRelationshipGoal: Array.isArray(preferences.preferred_relationship_goal) && preferences.preferred_relationship_goal.length > 0 
          ? normalizeArray(preferences.preferred_relationship_goal) 
          : ['serious_relationship'], // Default goal
        preferredSkinTone: Array.isArray(preferences.preferred_skin_tone) ? normalizeArray(preferences.preferred_skin_tone) : [],
        preferredFaceType: Array.isArray(preferences.preferred_face_type) ? normalizeArray(preferences.preferred_face_type) : [],
        preferredLoveLanguage: Array.isArray(preferences.preferred_love_language) ? normalizeArray(preferences.preferred_love_language) : [],
        preferredLifestyle: Array.isArray(preferences.preferred_lifestyle) ? normalizeArray(preferences.preferred_lifestyle) : []
      }));
    }
  }, [profile, preferences]);

  const handleLogout = async () => {
    try {
      // Clear Firebase auth
      await signOut();
      
      // Clear local storage
      localStorage.removeItem('demoProfile');
      localStorage.removeItem('demoPreferences');  
      localStorage.removeItem('demoUserId');
      localStorage.removeItem('demoQCS');
      localStorage.removeItem('subscription_plan');
      localStorage.removeItem('profile_complete');
      
      // The AuthContext will handle navigation automatically
      console.log('✅ Logout completed, AuthContext will handle navigation');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveChanges = async () => {
    // Update profile
    await updateProfile({
      first_name: formData.firstName,
      last_name: formData.lastName,
      bio: formData.bio,
      education_level: formData.educationLevel,
      profession: formData.profession,
      height: formData.height ? parseInt(formData.height) : undefined,
      body_type: formData.bodyType,
      skin_tone: formData.skinTone,
      personality_traits: formData.personalityTraits,
      values: formData.values,
      mindset: formData.mindset,
      relationship_goals: formData.relationshipGoals,
      interests: formData.interests,
      profile_images: formData.profileImages,
      show_profile: formData.isVisible
    });

  // Update preferences with validation
  const preferencesToUpdate = {
    preferred_gender: formData.preferredGender.length > 0 ? formData.preferredGender as any : ['male', 'female'], // Default to both if empty
    age_range_min: formData.ageRangeMin,
    age_range_max: formData.ageRangeMax,
    height_range_min: formData.heightRangeMin,
    height_range_max: formData.heightRangeMax,
    preferred_body_types: formData.preferredBodyTypes.length > 0 ? formData.preferredBodyTypes : ['slim', 'athletic', 'average'], // Default to common types
    preferred_values: formData.preferredValues.length > 0 ? formData.preferredValues : ['family_oriented', 'career_focused'], // Default values
    preferred_mindset: formData.preferredMindset.length > 0 ? formData.preferredMindset : ['growth_mindset'], // Default mindset
    preferred_personality_traits: formData.preferredPersonalityTraits.length > 0 ? formData.preferredPersonalityTraits : ['outgoing', 'empathetic'], // Default traits
    preferred_relationship_goal: formData.preferredRelationshipGoal.length > 0 ? formData.preferredRelationshipGoal : ['serious_relationship'], // Default goal
    preferred_skin_tone: formData.preferredSkinTone,
    preferred_face_type: formData.preferredFaceType,
    preferred_love_language: formData.preferredLoveLanguage,
    preferred_lifestyle: formData.preferredLifestyle
  };

  await updatePreferences(preferencesToUpdate);
  };

  const toggleArrayItem = (field: keyof typeof formData, item: string, maxItems: number = 10) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i: string) => i !== item)
      : currentArray.length < maxItems
      ? [...currentArray, item]
      : currentArray;
    
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const personalityTraitOptions = [
    "Adventurous", "Analytical", "Creative", "Outgoing", "Introverted", 
    "Empathetic", "Ambitious", "Laid-back", "Intellectual", "Spontaneous",
    "Humorous", "Practical", "Responsible", "Emotional"
  ];

  const valueOptions = [
    "Family-oriented", "Career-focused", "Health-conscious", "Spiritual", 
    "Traditional", "Social justice", "Environmental", "Creative", 
    "Intellectual", "Open-minded", "Adventure-seeking", "Financially responsible"
  ];

  const mindsetOptions = [
    "Growth Mindset", "Positive Thinking", "Pragmatic", "Optimistic", 
    "Realistic", "Ambitious", "Balanced"
  ];

  const relationshipGoalOptions = [
    "Serious relationship", "Casual dating", "Marriage", "Friendship first", 
    "Long-term commitment", "Short-term fun", "Open to anything"
  ];

  const interestOptions = [
    "Travel", "Reading", "Music", "Movies", "Sports", "Cooking", "Art", 
    "Technology", "Nature", "Photography", "Dancing", "Gaming", "Fitness", 
    "Writing", "Volunteering", "Fashion", "Food", "History", "Science", 
    "Politics", "Spirituality", "Adventure activities"
  ];

  const educationOptions = [
    "High School", "Undergraduate", "Postgraduate", "PhD / Doctorate", 
    "Working Professional", "Entrepreneur", "Other"
  ];

  const genderOptions = [
    { label: "Male", value: "male" as const },
    { label: "Female", value: "female" as const }, 
    { label: "Non-binary", value: "non_binary" as const },
    { label: "Other", value: "prefer_not_to_say" as const },
    { label: "All", value: "prefer_not_to_say" as const }
  ];

  const bodyTypeOptions = [
    "Slim", "Athletic", "Average", "Curvy", "Plus size", "Prefer not to say"
  ];

  const skinToneOptions = [
    "Very fair", "Fair", "Medium", "Olive", "Brown", "Dark"
  ];

  const faceTypeOptions = [
    "Round", "Oval", "Square", "Heart", "Diamond", "Long"
  ];

  const loveLanguageOptions = [
    "Words of Affirmation", "Acts of Service", "Receiving Gifts", 
    "Quality Time", "Physical Touch"
  ];

  const lifestyleOptions = [
    "Active", "Relaxed", "Social", "Homebody", "Adventurous", 
    "Career-focused", "Family-oriented", "Health-conscious", 
    "Party-goer", "Minimalist", "Creative", "Intellectual"
  ];

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
            className="border-primary/20 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
            className="border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">About Me</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({...prev, bio: e.target.value}))}
          placeholder="Tell us about yourself..."
          className="min-h-[100px] border-primary/20 focus:border-primary resize-none"
        />
        <div className="text-right text-xs text-muted-foreground">
          {formData.bio?.length || 0}/500
        </div>
      </div>

      <div className="space-y-2">
        <Label>University</Label>
        <Input
          value={profile?.university || ''}
          disabled
          className="bg-muted border-primary/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Education Level</Label>
          <Select value={formData.educationLevel} onValueChange={(value) => setFormData(prev => ({...prev, educationLevel: value}))}>
            <SelectTrigger className="border-primary/20 focus:border-primary">
              <SelectValue placeholder="Select education level" />
            </SelectTrigger>
            <SelectContent>
              {educationOptions.map((edu) => (
                <SelectItem key={edu} value={edu.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{edu}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Profession (Optional)</Label>
          <Input
            value={formData.profession}
            onChange={(e) => setFormData(prev => ({...prev, profession: e.target.value}))}
            placeholder="Your profession or field"
            className="border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          value={profile?.email || ''}
          disabled
          className="bg-muted border-primary/20"
        />
      </div>
    </div>
  );

  const renderWhatYouAre = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold">What You Are</h3>
        <p className="text-muted-foreground text-sm">Tell us about your physical attributes and personality</p>
      </div>

      {/* Physical Attributes */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Physical Attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                type="number"
                placeholder="175"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({...prev, height: e.target.value}))}
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>Body Type</Label>
              <Select value={formData.bodyType} onValueChange={(value) => setFormData(prev => ({...prev, bodyType: value}))}>
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  {bodyTypeOptions.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skin Tone</Label>
            <Select value={formData.skinTone} onValueChange={(value) => setFormData(prev => ({...prev, skinTone: value}))}>
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue placeholder="Select skin tone" />
              </SelectTrigger>
              <SelectContent>
                {skinToneOptions.map((tone) => (
                  <SelectItem key={tone} value={tone.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{tone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Personality */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Personality & Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Personality Traits (Pick up to 3)</Label>
            <div className="flex flex-wrap gap-2">
              {personalityTraitOptions.map((trait) => {
                const traitKey = trait.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.personalityTraits.includes(traitKey);
                return (
                  <Badge
                    key={trait}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('personalityTraits', traitKey, 3)}
                  >
                    {trait}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.personalityTraits.length}/3 selected
            </div>
          </div>

          <div className="space-y-3">
            <Label>Core Values (Pick up to 3)</Label>
            <div className="flex flex-wrap gap-2">
              {valueOptions.map((value) => {
                const valueKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.values.includes(valueKey);
                return (
                  <Badge
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('values', valueKey, 3)}
                  >
                    {value}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.values.length}/3 selected
            </div>
          </div>

          <div className="space-y-3">
            <Label>Mindset (Pick 1-2)</Label>
            <div className="flex flex-wrap gap-2">
              {mindsetOptions.map((mindset) => {
                const mindsetKey = mindset.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.mindset.includes(mindsetKey);
                return (
                  <Badge
                    key={mindset}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('mindset', mindsetKey, 2)}
                  >
                    {mindset}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.mindset.length}/2 selected
            </div>
          </div>

          <div className="space-y-3">
            <Label>Relationship Goals (Pick up to 2)</Label>
            <div className="flex flex-wrap gap-2">
              {relationshipGoalOptions.map((goal) => {
                const goalKey = goal.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.relationshipGoals.includes(goalKey);
                return (
                  <Badge
                    key={goal}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('relationshipGoals', goalKey, 2)}
                  >
                    {goal}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.relationshipGoals.length}/2 selected
            </div>
          </div>

          <div className="space-y-3">
            <Label>Interests (Pick up to 10)</Label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => {
                const interestKey = interest.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.interests.includes(interestKey);
                return (
                  <Badge
                    key={interest}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('interests', interestKey, 10)}
                  >
                    {interest}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.interests.length}/10 selected
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWhoYouWant = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Heart className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Who You Want</h3>
        <p className="text-muted-foreground text-sm">Tell us about your ideal partner</p>
      </div>

      {/* Basic Preferences */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Basic Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Preferred Gender</Label>
            <div className="flex flex-wrap gap-2">
              {genderOptions.map((gender) => {
                const isSelected = formData.preferredGender.includes(gender.label);
                return (
                  <Badge
                    key={gender.label}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredGender', gender.label, 4)}
                  >
                    {gender.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Age Range: {formData.ageRangeMin} - {formData.ageRangeMax} years</Label>
            <Slider
              value={[formData.ageRangeMin, formData.ageRangeMax]}
              onValueChange={([min, max]) => {
                setFormData(prev => ({ ...prev, ageRangeMin: min, ageRangeMax: max }));
              }}
              min={18}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label>Height Range: {formData.heightRangeMin} - {formData.heightRangeMax} cm</Label>
            <Slider
              value={[formData.heightRangeMin, formData.heightRangeMax]}
              onValueChange={([min, max]) => {
                setFormData(prev => ({ ...prev, heightRangeMin: min, heightRangeMax: max }));
              }}
              min={140}
              max={220}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label>Preferred Body Types</Label>
            <div className="flex flex-wrap gap-2">
              {bodyTypeOptions.map((type) => {
                const typeKey = type.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredBodyTypes.includes(typeKey);
                return (
                  <Badge
                    key={type}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredBodyTypes', typeKey)}
                  >
                    {type}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personality Preferences */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Personality & Values Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Preferred Values</Label>
            <div className="flex flex-wrap gap-2">
              {valueOptions.map((value) => {
                const valueKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredValues.includes(valueKey);
                return (
                  <Badge
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredValues', valueKey)}
                  >
                    {value}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Mindset</Label>
            <div className="flex flex-wrap gap-2">
              {mindsetOptions.map((mindset) => {
                const mindsetKey = mindset.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredMindset.includes(mindsetKey);
                return (
                  <Badge
                    key={mindset}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredMindset', mindsetKey)}
                  >
                    {mindset}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Personality Traits</Label>
            <div className="flex flex-wrap gap-2">
              {personalityTraitOptions.map((trait) => {
                const traitKey = trait.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredPersonalityTraits.includes(traitKey);
                return (
                  <Badge
                    key={trait}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredPersonalityTraits', traitKey)}
                  >
                    {trait}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Relationship Goals</Label>
            <div className="flex flex-wrap gap-2">
              {relationshipGoalOptions.map((goal) => {
                const goalKey = goal.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredRelationshipGoal.includes(goalKey);
                return (
                  <Badge
                    key={goal}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredRelationshipGoal', goalKey)}
                  >
                    {goal}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Skin Tone</Label>
            <div className="flex flex-wrap gap-2">
              {skinToneOptions.map((tone) => {
                const toneKey = tone.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredSkinTone.includes(toneKey);
                return (
                  <Badge
                    key={tone}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredSkinTone', toneKey)}
                  >
                    {tone}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Face Type</Label>
            <div className="flex flex-wrap gap-2">
              {faceTypeOptions.map((face) => {
                const faceKey = face.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredFaceType.includes(faceKey);
                return (
                  <Badge
                    key={face}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredFaceType', faceKey)}
                  >
                    {face}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Love Language</Label>
            <div className="flex flex-wrap gap-2">
              {loveLanguageOptions.map((language) => {
                const languageKey = language.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredLoveLanguage.includes(languageKey);
                return (
                  <Badge
                    key={language}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredLoveLanguage', languageKey)}
                  >
                    {language}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Lifestyle</Label>
            <div className="flex flex-wrap gap-2">
              {lifestyleOptions.map((lifestyle) => {
                const lifestyleKey = lifestyle.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredLifestyle.includes(lifestyleKey);
                return (
                  <Badge
                    key={lifestyle}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredLifestyle', lifestyleKey)}
                  >
                    {lifestyle}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPhotos = () => {
    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;

      const maxFiles = 6 - formData.profileImages.length;
      const filesToProcess = files.slice(0, maxFiles);

      console.log(`📸 Starting upload of ${filesToProcess.length} file(s)`);

      try {
        const uploadedUrls: string[] = [];
        const userId = getCurrentUserId();

        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          console.log(`📸 Processing file ${i + 1}:`, file.name, file.size);

          // Validate file
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
          }

          if (!file.type.startsWith('image/')) {
            throw new Error(`File ${file.name} is not an image. Please select image files only.`);
          }

          // Create unique filename
          const timestamp = Date.now();
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          const fileName = `${userId}/${timestamp}_${i}.${fileExt}`;

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('profile-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error('Storage upload error:', error);
            throw new Error(`Failed to upload ${file.name}: ${error.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('profile-images')
            .getPublicUrl(data.path);

          uploadedUrls.push(urlData.publicUrl);
        }

        // Update local state immediately
        const newImages = [...formData.profileImages, ...uploadedUrls];
        setFormData(prev => ({ ...prev, profileImages: newImages }));

        // Auto-save to backend
        await updateProfile({ profile_images: newImages });

        toast({
          title: "Photos uploaded",
          description: `Successfully uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}`,
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload photos. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Filter out empty, null, or invalid image URLs
    const validImages = (formData.profileImages || []).filter(
      (img) => typeof img === 'string' && img.trim() !== '' && img.startsWith('http')
    );

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Your Photos</h3>
          <p className="text-muted-foreground text-sm mb-2">
            Add up to 6 photos to show your personality. Drag to reorder.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            The first photo will be your main profile picture that others see first.
          </p>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-4">
          {validImages.length > 0 ? (
            validImages.map((image, index) => (
              <div 
                key={`${image}-${index}`}
                className="aspect-square relative group overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/60"
              >
                {image.includes('placeholder') || image.includes('via.placeholder') ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-primary/60 mx-auto mb-1" />
                      <p className="text-xs text-primary/60">Demo Photo {index + 1}</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={image}
                    alt={`Profile ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                )}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    Main
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-500/80 hover:bg-red-600/80"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <Camera className="w-20 h-20 mx-auto mb-4 text-primary/60" />
              <h4 className="text-lg font-semibold mb-2">Add Your First Photo</h4>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Photos are the most important part of your profile. Add at least 3 photos to get better matches.
              </p>
              <label className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                <Camera className="w-5 h-5" />
                Choose Your First Photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Empty Slots */}
          {validImages.length > 0 && validImages.length < 6 && 
            Array.from({ length: 6 - validImages.length }).map((_, index) => (
              <label
                key={`empty-${index}`}
                className="aspect-square border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center hover:border-primary/60 transition-colors cursor-pointer group bg-muted/20"
              >
                <div className="text-center">
                  <Camera className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors mx-auto mb-2" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            ))}
        </div>

        {/* Photo Tips */}
        {validImages.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">📸 Photo Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use high-quality, well-lit photos</li>
              <li>• Show your face clearly in the first photo</li>
              <li>• Include variety: close-ups, full body, activities</li>
              <li>• Smile and look confident</li>
              <li>• Avoid group photos as your main picture</li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Privacy & Visibility</h3>
        <p className="text-muted-foreground text-sm">Control how others see your profile</p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to other users for matching
              </p>
            </div>
            <Switch
              checked={formData.isVisible}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-primary/20 rounded-lg opacity-50">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium">Verification Status</div>
              <div className="text-sm text-muted-foreground">Get verified for more matches</div>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            {profile?.verification_status || 'Pending'}
          </Badge>
        </div>

        <div 
          className="flex items-center justify-between p-4 border border-primary/20 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigate('subscription')}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-secondary" />
            <div>
              <div className="font-medium">Premium Features</div>
              <div className="text-sm text-muted-foreground">Unlock advanced matching</div>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="bg-gradient-secondary">
            <Star className="w-4 h-4 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'what-you-are', label: 'What You Are', icon: User },
    { id: 'who-you-want', label: 'Who You Want', icon: Heart },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      {/* Header - Consistent with other sections */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('home')} className="text-foreground hover:text-foreground hover:bg-muted p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/40 bg-gradient-primary flex items-center justify-center">
              {formData.profileImages && formData.profileImages.length > 0 && formData.profileImages[0] ? (
                <img
                  src={formData.profileImages[0]}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.user_id || 'default'}`; }}
                />
              ) : (
                <span className="text-primary-foreground font-bold text-sm">DS</span>
              )}
            </div>
            <h1 className="text-base font-display font-bold text-foreground">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-gradient-primary text-primary-foreground text-sm px-4 py-2" onClick={handleSaveChanges}>
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl pb-24">
        {/* Profile Summary Card */}
        <Card className="mb-6 shadow-glow border-border/50 overflow-hidden bg-card/80 backdrop-blur-sm">
          <div className="bg-gradient-primary p-6 text-primary-foreground">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                {formData.profileImages[0] ? (
                  <img
                    src={formData.profileImages[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.user_id || 'default'}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=profile-${profile?.user_id || 'default'}`;
                    }}
                  />
                 ) : (
                   <div className="w-full h-full bg-white/20 flex items-center justify-center">
                     <User className="w-8 h-8 text-white/60" />
                   </div>
                 )}
               </div>
               <div>
                 <h2 className="text-xl font-bold">{formData.firstName} {formData.lastName}</h2>
                 <div className="flex items-center gap-2 text-white/90">
                   <Calendar className="w-4 h-4" />
                   <span className="text-sm">{profile?.university || 'University'}</span>
                 </div>
               </div>
             </div>
           </div>
         </Card>

         {/* Tabs - Fixed Mobile Layout */}
         <Card className="mb-6 shadow-glow border-border/50 bg-card/80 backdrop-blur-sm">
           <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide">
             {tabs.map(({ id, label, icon: Icon }) => (
               <Button
                 key={id}
                 variant={activeTab === id ? "default" : "ghost"}
                 onClick={() => setActiveTab(id as any)}
                 className={`shrink-0 px-3 py-2 text-xs font-medium transition-all ${
                   activeTab === id 
                     ? 'bg-primary text-primary-foreground shadow-sm' 
                     : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                 }`}
                 size="sm"
               >
                 <Icon className="w-3 h-3 mr-1" />
                 {id === 'what-you-are' ? 'You Are' : id === 'who-you-want' ? 'You Want' : label.split(' ')[0]}
               </Button>
             ))}
           </div>
         </Card>

        {/* Tab Content */}
        <Card className="shadow-glow border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'what-you-are' && renderWhatYouAre()}
            {activeTab === 'who-you-want' && renderWhoYouWant()}
            {activeTab === 'photos' && renderPhotos()}
            {activeTab === 'privacy' && renderPrivacy()}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="hidden">
        <div className="flex justify-center space-x-8 max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground"
          >
            <div className="p-2">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm" 
            onClick={() => onNavigate('swipe')}
            className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground"
          >
            <div className="p-2">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-xs">Swipe</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('matches')}
            className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground"
          >
            <div className="p-2">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs">Matches</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 text-primary"
          >
            <div className="p-2 bg-gradient-primary rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfileManagement;