import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Calendar, 
  MapPin,
  Heart,
  Camera,
  Plus,
  X,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
import { auth } from "../../firebase";

interface DetailedProfileCreationProps {
  onBack: () => void;
  onComplete: () => void;
}

const DetailedProfileCreation = ({ onBack, onComplete }: DetailedProfileCreationProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Profile Data
  const [profileData, setProfileData] = useState({
    // Basic Info
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    college: "",
    university: "",
    fieldOfStudy: "",
    educationLevel: "",
    profession: "",
    phoneNumber: "",
    
    // Profile Settings
    isProfilePublic: false,
    
    // Media
    profileImages: [] as File[],
    
    // Physical Attributes
    height: "",
    bodyType: "",
    skinTone: "",
    faceType: "",
    
    // Personality
    personalityType: "",
    personalityTraits: [] as string[],
    hobbies: [] as string[],
    relationshipGoal: "",
    humorStyle: "",
    loveLanguage: "",
    bio: "",
    interests: [] as string[],
    values: [] as string[],
    mindset: [] as string[],
    communicationStyle: "concise",
    lifestyle: [] as string[],
    
    // Partner Preferences - Physical
    preferredGender: [] as string[],
    ageRangeMin: 18,
    ageRangeMax: 30,
    heightRangeMin: 150,
    heightRangeMax: 190,
    preferredSkinType: [] as string[],
    preferredBodyShape: [] as string[],
    preferredFaceTypes: [] as string[],
    
    // Partner Preferences - Mental
    preferredHumorStyle: [] as string[],
    preferredPersonalityType: [] as string[],
    preferredRelationshipGoal: [] as string[],
    preferredLifestyleHabits: [] as string[],
    preferredValues: [] as string[],
    preferredMindset: [] as string[],
    preferredLoveLanguages: [] as string[],
    preferredEducationLevels: [] as string[],
    preferredProfessions: [] as string[],
    preferredInterests: [] as string[],
    preferredCommunicationStyle: [] as string[]
  });

  const totalSteps = 7;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (profileData.profileImages.length + files.length > 6) {
      toast({
        title: "Too many images",
        description: "You can upload maximum 6 images",
        variant: "destructive"
      });
      return;
    }
    setProfileData(prev => ({
      ...prev,
      profileImages: [...prev.profileImages, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      profileImages: prev.profileImages.filter((_, i) => i !== index)
    }));
  };

  const addTag = (field: keyof typeof profileData, value: string) => {
    const currentArray = profileData[field] as string[];
    if (!currentArray.includes(value) && value.trim()) {
      setProfileData(prev => ({
        ...prev,
        [field]: [...currentArray, value]
      }));
    }
  };

  const removeTag = (field: keyof typeof profileData, value: string) => {
    const currentArray = profileData[field] as string[];
    setProfileData(prev => ({
      ...prev,
      [field]: currentArray.filter(item => item !== value)
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields before proceeding
      if (!profileData.firstName || !profileData.lastName || !profileData.dateOfBirth || 
          !profileData.gender || !profileData.university) {
        throw new Error('Please fill in all required fields: First Name, Last Name, Date of Birth, Gender, and University');
      }

      // Get current Firebase user
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // 1. Upload profile images to storage first (if any)
      let imageUrls: string[] = [];
      if (profileData.profileImages.length > 0) {
        imageUrls = await Promise.all(
          profileData.profileImages.map(async (file, index) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${firebaseUser.uid}-${Date.now()}-${index}.${fileExt}`;
            const filePath = `profile-images/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('profile-images')
              .upload(filePath, file);
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
              .from('profile-images')
              .getPublicUrl(filePath);
              
            return publicUrl;
          })
        );
      }

      // 2. Use the profile-completion edge function via Supabase client
      const { error: createError } = await supabase.functions.invoke('profile-completion', {
        body: {
          userId: firebaseUser.uid,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender,
          university: profileData.university,
          fieldOfStudy: profileData.fieldOfStudy,
          height: profileData.height ? parseInt(profileData.height) : null,
          bodyType: profileData.bodyType,
          skinTone: profileData.skinTone,
          faceType: profileData.faceType,
          personalityType: profileData.personalityType,
          values: profileData.values?.length ? profileData.values[0] : null,
          mindset: profileData.mindset?.length ? profileData.mindset[0] : null,
          relationshipGoals: profileData.relationshipGoal ? [profileData.relationshipGoal] : [],
          interests: profileData.interests,
          bio: profileData.bio,
          humorStyle: profileData.humorStyle,
          profileImages: imageUrls,
          isProfilePublic: profileData.isProfilePublic,
          qcsScore: 0,
          preferences: {
            preferredGender: profileData.preferredGender,
            ageRangeMin: profileData.ageRangeMin,
            ageRangeMax: profileData.ageRangeMax,
            heightRangeMin: profileData.heightRangeMin,
            heightRangeMax: profileData.heightRangeMax,
            preferredBodyTypes: profileData.preferredBodyShape,
            preferredSkinTone: profileData.preferredSkinType,
            preferredFaceType: profileData.preferredFaceTypes,
            preferredValues: profileData.preferredValues,
            preferredMindset: profileData.preferredMindset,
            preferredPersonality: profileData.preferredPersonalityType,
            preferredRelationshipGoals: profileData.preferredRelationshipGoal,
            loveLanguage: profileData.loveLanguage,
            lifestyle: profileData.lifestyle?.length ? profileData.lifestyle[0] : null
          },
          email: firebaseUser.email
        }
      });

      if (createError) {
        throw new Error(createError.message || 'Failed to create profile');
      }

      // Store minimal data in localStorage for reference
      const profileDataToStore = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        profile_images: imageUrls,
        is_profile_public: profileData.isProfilePublic
      };
      
      localStorage.setItem('userProfile', JSON.stringify(profileDataToStore));

      toast({
        title: "Profile created successfully! ✨",
        description: "Let's verify your identity next"
      });

      onComplete();
    } catch (error: any) {
      console.error('Profile creation error:', error);
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Show Your Best Self ✨
              </h2>
              <p className="text-muted-foreground font-prompt">Upload up to 6 photos that represent you</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gradient-card rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center relative overflow-hidden hover:border-primary/50 transition-smooth hover:shadow-soft"
                >
                  {profileData.profileImages[index] ? (
                    <>
                      <img
                        src={URL.createObjectURL(profileData.profileImages[index])}
                        alt={`Profile ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center text-white hover:bg-destructive/80 shadow-soft"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center p-4 text-center w-full h-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        multiple
                      />
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground font-prompt font-medium">
                        {index === 0 ? "Main Photo" : `Photo ${index + 1}`}
                      </span>
                    </label>
                  )}
                </div>
              ))}
            </div>

            {/* PUBLIC PROFILE OPTION - REPLACED VOICE */}
            <Card className="border-2 border-primary/20 bg-gradient-card shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {profileData.isProfilePublic ? 
                        <Eye className="w-4 h-4 text-success" /> : 
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      }
                      <Label htmlFor="public-profile" className="font-medium">
                        Do you want to show your profile publicly?
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground font-prompt">
                      {profileData.isProfilePublic 
                        ? "Your profile will be visible to other verified students for matching" 
                        : "Your profile will be private until you manually enable public visibility"
                      }
                    </p>
                  </div>
                  <Switch
                    id="public-profile"
                    checked={profileData.isProfilePublic}
                    onCheckedChange={(checked) => 
                      setProfileData(prev => ({ ...prev, isProfilePublic: checked }))
                    }
                    className="data-[state=checked]:bg-success"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Basic Information 📝
              </h2>
              <p className="text-muted-foreground font-prompt">Tell us about yourself</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="rounded-xl h-12 border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="rounded-xl h-12 border-border/50 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="rounded-xl h-12 border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={profileData.gender} onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger className="rounded-xl h-12 border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>University/College</Label>
              <Input
                placeholder="Harvard University"
                value={profileData.college}
                onChange={(e) => setProfileData(prev => ({ ...prev, college: e.target.value }))}
                className="rounded-xl h-12 border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number (Optional)</Label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={profileData.phoneNumber}
                onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="rounded-xl h-12 border-border/50 focus:border-primary"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                About Your Physical Attributes 📏
              </h2>
              <p className="text-muted-foreground font-prompt">Help us match you better</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 170"
                  value={profileData.height}
                  onChange={(e) => setProfileData(prev => ({ ...prev, height: e.target.value }))}
                  className="rounded-xl h-12 border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-3">
                <Label>Body Type</Label>
                <Select value={profileData.bodyType} onValueChange={(value) => setProfileData(prev => ({ ...prev, bodyType: value }))}>
                  <SelectTrigger className="rounded-xl h-12 border-border/50">
                    <SelectValue placeholder="Select your body type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slim">Slim</SelectItem>
                    <SelectItem value="athletic">Athletic</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="curvy">Curvy</SelectItem>
                    <SelectItem value="plus_size">Plus Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Skin Tone</Label>
                <Select value={profileData.skinTone} onValueChange={(value) => setProfileData(prev => ({ ...prev, skinTone: value }))}>
                  <SelectTrigger className="rounded-xl h-12 border-border/50">
                    <SelectValue placeholder="Select your skin tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="wheatish">Wheatish</SelectItem>
                    <SelectItem value="olive">Olive</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Face Type</Label>
                <Select value={profileData.faceType} onValueChange={(value) => setProfileData(prev => ({ ...prev, faceType: value }))}>
                  <SelectTrigger className="rounded-xl h-12 border-border/50">
                    <SelectValue placeholder="Select your face type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oval">Oval</SelectItem>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="heart">Heart</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Your Personality 🌟
              </h2>
              <p className="text-muted-foreground font-prompt">Help us understand who you are</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Personality Type</Label>
                <Select value={profileData.personalityType} onValueChange={(value) => setProfileData(prev => ({ ...prev, personalityType: value }))}>
                  <SelectTrigger className="rounded-xl h-12 border-border/50 focus:border-primary">
                    <SelectValue placeholder="How would you describe yourself?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="introvert">Introvert 🤫</SelectItem>
                    <SelectItem value="extrovert">Extrovert 🎉</SelectItem>
                    <SelectItem value="ambivert">Ambivert ⚖️</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Relationship Goal</Label>
                <Select value={profileData.relationshipGoal} onValueChange={(value) => setProfileData(prev => ({ ...prev, relationshipGoal: value }))}>
                  <SelectTrigger className="rounded-xl h-12 border-border/50 focus:border-primary">
                    <SelectValue placeholder="What are you looking for?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual Dating 😄</SelectItem>
                    <SelectItem value="serious">Serious Relationship 💍</SelectItem>
                    <SelectItem value="friendship">Friendship 👫</SelectItem>
                    <SelectItem value="networking">Networking 🤝</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Humor Style</Label>
                <Select value={profileData.humorStyle} onValueChange={(value) => setProfileData(prev => ({ ...prev, humorStyle: value }))}>
                  <SelectTrigger className="rounded-xl h-12 border-border/50 focus:border-primary">
                    <SelectValue placeholder="What's your humor like?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="witty">Witty 🧠</SelectItem>
                    <SelectItem value="sarcastic">Sarcastic 😏</SelectItem>
                    <SelectItem value="light">Light & Fun 😊</SelectItem>
                    <SelectItem value="dark">Dark Humor 🖤</SelectItem>
                    <SelectItem value="silly">Silly 🤪</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Love Language</Label>
                <Select value={profileData.loveLanguage} onValueChange={(value) => setProfileData(prev => ({ ...prev, loveLanguage: value }))}>
                  <SelectTrigger className="rounded-xl h-12 border-border/50 focus:border-primary">
                    <SelectValue placeholder="How do you express love?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="words_of_affirmation">Words of Affirmation 💬</SelectItem>
                    <SelectItem value="acts_of_service">Acts of Service 🤲</SelectItem>
                    <SelectItem value="receiving_gifts">Receiving Gifts 🎁</SelectItem>
                    <SelectItem value="quality_time">Quality Time ⏰</SelectItem>
                    <SelectItem value="physical_touch">Physical Touch 🤗</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell us about yourself in your own words..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  className="rounded-xl min-h-[100px] resize-none border-border/50 focus:border-primary"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {profileData.bio.length}/500
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Partner Physical Preferences 💕
              </h2>
              <p className="text-muted-foreground font-prompt">What attracts you physically?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Preferred Gender</Label>
                <div className="flex flex-wrap gap-2">
                  {['male', 'female', 'other'].map((gender) => (
                    <Badge
                      key={gender}
                      variant={profileData.preferredGender.includes(gender) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 rounded-full hover:scale-105 transition-smooth"
                      onClick={() => {
                        if (profileData.preferredGender.includes(gender)) {
                          removeTag('preferredGender', gender);
                        } else {
                          addTag('preferredGender', gender);
                        }
                      }}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Age Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min age"
                      value={profileData.ageRangeMin}
                      onChange={(e) => setProfileData(prev => ({ ...prev, ageRangeMin: parseInt(e.target.value) || 18 }))}
                      min={18}
                      max={65}
                      className="rounded-xl h-12 border-border/50 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max age"
                      value={profileData.ageRangeMax}
                      onChange={(e) => setProfileData(prev => ({ ...prev, ageRangeMax: parseInt(e.target.value) || 30 }))}
                      min={18}
                      max={65}
                      className="rounded-xl h-12 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Skin Type</Label>
                <div className="flex flex-wrap gap-2">
                  {['fair', 'wheatish', 'dark', 'doesnt_matter'].map((type) => (
                    <Badge
                      key={type}
                      variant={profileData.preferredSkinType.includes(type) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 rounded-full hover:scale-105 transition-smooth"
                      onClick={() => {
                        if (profileData.preferredSkinType.includes(type)) {
                          removeTag('preferredSkinType', type);
                        } else {
                          addTag('preferredSkinType', type);
                        }
                      }}
                    >
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Body Shape</Label>
                <div className="flex flex-wrap gap-2">
                  {['slim', 'fit', 'average', 'curvy', 'doesnt_matter'].map((shape) => (
                    <Badge
                      key={shape}
                      variant={profileData.preferredBodyShape.includes(shape) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 rounded-full hover:scale-105 transition-smooth"
                      onClick={() => {
                        if (profileData.preferredBodyShape.includes(shape)) {
                          removeTag('preferredBodyShape', shape);
                        } else {
                          addTag('preferredBodyShape', shape);
                        }
                      }}
                    >
                      {shape.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Partner Mental Preferences 🧠
              </h2>
              <p className="text-muted-foreground font-prompt">What personality attracts you?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Preferred Humor Style</Label>
                <div className="flex flex-wrap gap-2">
                  {['witty', 'sarcastic', 'light', 'dark', 'silly'].map((humor) => (
                    <Badge
                      key={humor}
                      variant={profileData.preferredHumorStyle.includes(humor) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 rounded-full hover:scale-105 transition-smooth"
                      onClick={() => {
                        if (profileData.preferredHumorStyle.includes(humor)) {
                          removeTag('preferredHumorStyle', humor);
                        } else {
                          addTag('preferredHumorStyle', humor);
                        }
                      }}
                    >
                      {humor.charAt(0).toUpperCase() + humor.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Personality Type</Label>
                <div className="flex flex-wrap gap-2">
                  {['introvert', 'extrovert', 'ambivert'].map((personality) => (
                    <Badge
                      key={personality}
                      variant={profileData.preferredPersonalityType.includes(personality) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 rounded-full hover:scale-105 transition-smooth"
                      onClick={() => {
                        if (profileData.preferredPersonalityType.includes(personality)) {
                          removeTag('preferredPersonalityType', personality);
                        } else {
                          addTag('preferredPersonalityType', personality);
                        }
                      }}
                    >
                      {personality.charAt(0).toUpperCase() + personality.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Relationship Goal</Label>
                <div className="flex flex-wrap gap-2">
                  {['casual', 'serious', 'friendship', 'networking'].map((goal) => (
                    <Badge
                      key={goal}
                      variant={profileData.preferredRelationshipGoal.includes(goal) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 rounded-full hover:scale-105 transition-smooth"
                      onClick={() => {
                        if (profileData.preferredRelationshipGoal.includes(goal)) {
                          removeTag('preferredRelationshipGoal', goal);
                        } else {
                          addTag('preferredRelationshipGoal', goal);
                        }
                      }}
                    >
                      {goal.charAt(0).toUpperCase() + goal.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Review Your Profile ✨
              </h2>
              <p className="text-muted-foreground font-prompt">Make sure everything looks perfect</p>
            </div>

            <div className="space-y-4">
              <Card className="border border-primary/20 shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {profileData.firstName} {profileData.lastName}</p>
                  <p><strong>Gender:</strong> {profileData.gender}</p>
                  <p><strong>College:</strong> {profileData.college}</p>
                  <p><strong>Profile Public:</strong> {profileData.isProfilePublic ? "✅ Yes" : "❌ No"}</p>
                </CardContent>
              </Card>

              <Card className="border border-primary/20 shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">📸 {profileData.profileImages.length} photo(s) uploaded</p>
                </CardContent>
              </Card>

              <Card className="border border-primary/20 shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Personality</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Type:</strong> {profileData.personalityType}</p>
                  <p><strong>Relationship Goal:</strong> {profileData.relationshipGoal}</p>
                  <p><strong>Humor:</strong> {profileData.humorStyle}</p>
                  <p><strong>Love Language:</strong> {profileData.loveLanguage}</p>
                </CardContent>
              </Card>

              <Card className="border border-success/20 bg-success/5 shadow-card">
                <CardContent className="p-4 text-center">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-success" />
                  <p className="text-sm font-medium text-success">
                    Profile looks amazing! Ready to verify your identity.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleBack} className="hover:bg-white/20 transition-smooth">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="w-24 h-2 bg-muted/50 rounded-full mt-1">
              <div 
                className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Content Card */}
        <Card className="shadow-card border-0 bg-gradient-card backdrop-blur-sm">
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <div /> {/* Spacer */}
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              variant="coral"
              className="rounded-xl px-8 font-semibold"
              disabled={
                (currentStep === 1 && profileData.profileImages.length === 0) ||
                (currentStep === 2 && (!profileData.firstName || !profileData.lastName || !profileData.gender)) ||
                (currentStep === 3 && (!profileData.height || !profileData.bodyType)) ||
                (currentStep === 4 && !profileData.personalityType)
              }
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="coral"
              className="rounded-xl px-8 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  Complete Profile
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedProfileCreation;