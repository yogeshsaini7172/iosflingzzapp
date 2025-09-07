import { useState, useEffect } from 'react';
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
  GraduationCap
} from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedProfileManagementProps {
  onNavigate: (view: string) => void;
}

const EnhancedProfileManagement = ({ onNavigate }: EnhancedProfileManagementProps) => {
  const { profile, preferences, isLoading, updateProfile, updatePreferences } = useProfileData();
  const [activeTab, setActiveTab] = useState<'basic' | 'what-you-are' | 'who-you-want' | 'photos' | 'privacy'>('basic');

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
    
    // Settings
    isVisible: true,
    profileImages: [] as string[]
  });

  // Update form data when profile/preferences load
  useEffect(() => {
    if (profile) {
      console.log("📊 Loading profile data into form:", profile);
      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        bio: profile.bio || '',
        educationLevel: profile.education_level || '',
        profession: profile.profession || '',
        height: profile.height?.toString() || '',
        bodyType: profile.body_type || '',
        skinTone: profile.skin_tone || '',
        personalityTraits: profile.personality_traits || [],
        values: Array.isArray(profile.values) ? profile.values : (profile.values ? [profile.values] : []),
        mindset: Array.isArray(profile.mindset) ? profile.mindset : (profile.mindset ? [profile.mindset] : []),
        relationshipGoals: profile.relationship_goals || [],
        interests: profile.interests || [],
        isVisible: profile.show_profile !== false,
        profileImages: profile.profile_images || []
      }));
    }
    
    if (preferences) {
      console.log("📊 Loading preferences data into form:", preferences);
      setFormData(prev => ({
        ...prev,
        preferredGender: preferences.preferred_gender?.map(g => g.toString()) || [],
        ageRangeMin: preferences.age_range_min || 18,
        ageRangeMax: preferences.age_range_max || 30,
        heightRangeMin: preferences.height_range_min || 150,
        heightRangeMax: preferences.height_range_max || 200,
        preferredBodyTypes: preferences.preferred_body_types || [],
        preferredValues: preferences.preferred_values || [],
        preferredMindset: preferences.preferred_mindset || [],
        preferredPersonalityTraits: preferences.preferred_personality_traits || [],
        preferredRelationshipGoal: preferences.preferred_relationship_goal || []
      }));
    }
  }, [profile, preferences]);

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('demoProfile');
      localStorage.removeItem('demoPreferences');
      localStorage.removeItem('demoUserId');
      localStorage.removeItem('demoQCS');
      localStorage.removeItem('subscription_plan');
      
      // Navigate to home
      onNavigate('home');
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
      show_profile: formData.isVisible
    });

    // Update preferences
    await updatePreferences({
      preferred_gender: formData.preferredGender as any,
      age_range_min: formData.ageRangeMin,
      age_range_max: formData.ageRangeMax,
      height_range_min: formData.heightRangeMin,
      height_range_max: formData.heightRangeMax,
      preferred_body_types: formData.preferredBodyTypes,
      preferred_values: formData.preferredValues,
      preferred_mindset: formData.preferredMindset,
      preferred_personality_traits: formData.preferredPersonalityTraits,
      preferred_relationship_goal: formData.preferredRelationshipGoal
    });
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
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
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
            <Label>Relationship Goals (Max 3)</Label>
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
                    onClick={() => toggleArrayItem('relationshipGoals', goalKey, 3)}
                  >
                    {goal}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.relationshipGoals.length}/3 selected
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
        <p className="text-muted-foreground text-sm">What are you looking for in a partner?</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5" />
            Partner Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Interested in</Label>
            <div className="flex flex-wrap gap-2">
               {genderOptions.map((gender) => {
                 const isSelected = formData.preferredGender.includes(gender.value);
                 return (
                   <Button
                     key={gender.label}
                     variant={isSelected ? "default" : "outline"}
                     size="sm"
                     onClick={() => toggleArrayItem('preferredGender', gender.value, 4)}
                     className={`rounded-full ${
                       isSelected 
                         ? 'bg-gradient-primary' 
                         : 'border-primary/20 hover:border-primary'
                     }`}
                   >
                     {gender.label}
                   </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Age Range: {formData.ageRangeMin} - {formData.ageRangeMax} years</Label>
            <div className="px-2">
              <Slider
                value={[formData.ageRangeMin, formData.ageRangeMax]}
                onValueChange={([min, max]) => {
                  setFormData(prev => ({...prev, ageRangeMin: min, ageRangeMax: max}));
                }}
                min={18}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Height Range: {formData.heightRangeMin} - {formData.heightRangeMax} cm</Label>
            <div className="px-2">
              <Slider
                value={[formData.heightRangeMin, formData.heightRangeMax]}
                onValueChange={([min, max]) => {
                  setFormData(prev => ({...prev, heightRangeMin: min, heightRangeMax: max}));
                }}
                min={140}
                max={220}
                step={1}
                className="w-full"
              />
            </div>
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
                    onClick={() => toggleArrayItem('preferredBodyTypes', typeKey, 6)}
                  >
                    {type}
                  </Badge>
                );
              })}
            </div>
          </div>

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
                    onClick={() => toggleArrayItem('preferredValues', valueKey, 12)}
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
                    onClick={() => toggleArrayItem('preferredMindset', mindsetKey, 7)}
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
                    onClick={() => toggleArrayItem('preferredPersonalityTraits', traitKey, 14)}
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
                    onClick={() => toggleArrayItem('preferredRelationshipGoal', goalKey, 3)}
                  >
                    {goal}
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
      const files = event.target.files;
      if (!files) return;

      try {
        const uploadedUrls: string[] = [];
        
        for (let i = 0; i < Math.min(files.length, 6); i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${i}.${fileExt}`;
          const filePath = `${profile?.user_id}/${fileName}`;

          const { error } = await supabase.storage
            .from('profile-images')
            .upload(filePath, file);

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('profile-images')
            .getPublicUrl(filePath);

          uploadedUrls.push(urlData.publicUrl);
        }

        // Set the first uploaded photo as the main profile photo
        const newImages = [...formData.profileImages, ...uploadedUrls];
        setFormData(prev => ({ ...prev, profileImages: newImages }));
        
        // Update profile with new images
        await updateProfile({
          profile_images: newImages
        });

        console.log("✅ Photos uploaded successfully, first photo set as main:", uploadedUrls[0]);
      } catch (error) {
        console.error('❌ Error uploading photos:', error);
      }
    };

    const removePhoto = async (index: number) => {
      const newImages = formData.profileImages.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, profileImages: newImages }));
      
      await updateProfile({
        profile_images: newImages
      });
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Your Photos</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Add up to 6 photos to show your personality. The first photo will be your main profile picture.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {formData.profileImages.map((image, index) => (
            <div key={index} className="aspect-square relative group overflow-hidden rounded-xl border-2 border-primary/20">
              <img
                src={image}
                alt={`Profile ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button variant="secondary" size="sm" onClick={() => removePhoto(index)}>
                  ×
                </Button>
              </div>
              {index === 0 && (
                <Badge className="absolute top-2 left-2 bg-primary text-white border-0">
                  Main
                </Badge>
              )}
            </div>
          ))}
          
          {Array.from({ length: 6 - formData.profileImages.length }).map((_, index) => (
            <label
              key={`empty-${index}`}
              className="aspect-square border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center hover:border-primary/60 transition-colors cursor-pointer group"
            >
              <div className="text-center">
                <Camera className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors mx-auto mb-2" />
                <span className="text-xs text-muted-foreground">Add Photo</span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          ))}
        </div>

        {formData.profileImages.length === 0 && (
          <div className="text-center py-8 bg-muted/50 rounded-lg">
            <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No photos uploaded yet</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="w-4 h-4" />
              Upload Your First Photo
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    );
  };

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium">Profile Visibility</div>
              <div className="text-sm text-muted-foreground">Show your profile to others</div>
            </div>
          </div>
          <Switch
            checked={formData.isVisible}
            onCheckedChange={(checked) => setFormData(prev => ({...prev, isVisible: checked}))}
          />
        </div>

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

        <div className="flex items-center justify-between p-4 border border-primary/20 rounded-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-rose-200/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('home')} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-rose-700">Edit Profile</h1>
              <p className="text-sm text-rose-500">Make yourself shine ✨</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600" onClick={handleSaveChanges}>
              Save Changes
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-rose-600 border-rose-200 hover:bg-rose-50">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl pb-24">
        {/* Profile Summary Card */}
        <Card className="mb-6 shadow-lg border-rose-200/50 overflow-hidden bg-white/80 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-rose-400 to-pink-500 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                {formData.profileImages[0] ? (
                  <img
                    src={formData.profileImages[0].startsWith('blob:') || formData.profileImages[0].startsWith('http') 
                      ? formData.profileImages[0] 
                      : `${supabase.storage.from('profile-photos').getPublicUrl(formData.profileImages[0]).data.publicUrl}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400';
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
                  <span>Age: {new Date().getFullYear() - (profile?.date_of_birth ? new Date(profile.date_of_birth).getFullYear() : 2000)}</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span>{profile?.university}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="mb-6 shadow-lg border-rose-200/50 bg-white/80 backdrop-blur-sm">
          <div className="flex overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? "default" : "ghost"}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 rounded-none border-b-2 text-xs sm:text-sm ${
                  activeTab === id 
                    ? 'border-rose-400 bg-rose-50 text-rose-700' 
                    : 'border-transparent hover:bg-rose-50 text-rose-600'
                }`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Content */}
        <Card className="shadow-lg border-rose-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="capitalize text-rose-700">{activeTab.replace('-', ' ')} Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'what-you-are' && renderWhatYouAre()}
            {activeTab === 'who-you-want' && renderWhoYouWant()}
            {activeTab === 'photos' && renderPhotos()}
            {activeTab === 'privacy' && renderPrivacy()}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-rose-200/50 z-50 shadow-lg">
        <div className="flex justify-around items-center py-2 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Heart className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('pairing')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Pairing</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('blind-date')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Sparkles className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Blind Date</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('profile')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <div className="w-6 h-6 bg-gradient-to-r from-rose-400 to-pink-500 rounded-lg flex items-center justify-center mb-1">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium">Profile</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('subscription')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Star className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Premium</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfileManagement;