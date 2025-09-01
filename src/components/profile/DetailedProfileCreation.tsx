import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Camera, 
  Mic, 
  Video,
  Plus,
  X,
  Heart,
  User,
  Calendar,
  Phone,
  MapPin,
  Palette,
  Brain,
  Target
} from "lucide-react";

interface DetailedProfileCreationProps {
  onComplete: () => void;
  onBack: () => void;
}

interface ProfileData {
  // Basic Info
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  college: string;
  major: string;
  yearOfStudy: string;
  location: string;
  
  // Personality
  personalityType: string;
  introvertExtrovert: string;
  hobbies: string[];
  relationshipGoals: string[];
  humorStyle: string;
  loveLanguage: string;
  bio: string;
  
  // Partner Preferences - Physical
  preferredAge: { min: number; max: number };
  preferredHeight: { min: number; max: number };
  preferredSkinType: string[];
  preferredBodyShape: string[];
  preferredLifestyle: string[];
  
  // Partner Preferences - Mental
  preferredHumor: string[];
  preferredPersonality: string[];
  preferredValues: string[];
  
  // Media
  photos: File[];
  videos: File[];
  voiceIntro: File | null;
}

const DetailedProfileCreation = ({ onComplete, onBack }: DetailedProfileCreationProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    college: "",
    major: "",
    yearOfStudy: "",
    location: "",
    personalityType: "",
    introvertExtrovert: "",
    hobbies: [],
    relationshipGoals: [],
    humorStyle: "",
    loveLanguage: "",
    bio: "",
    preferredAge: { min: 18, max: 30 },
    preferredHeight: { min: 150, max: 200 },
    preferredSkinType: [],
    preferredBodyShape: [],
    preferredLifestyle: [],
    preferredHumor: [],
    preferredPersonality: [],
    preferredValues: [],
    photos: [],
    videos: [],
    voiceIntro: null
  });

  const handlePhotoUpload = (files: FileList | null) => {
    if (files && profileData.photos.length < 6) {
      const newPhotos = Array.from(files).slice(0, 6 - profileData.photos.length);
      setProfileData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }));
    }
  };

  const removePhoto = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const toggleInterest = (interest: string, field: keyof ProfileData) => {
    setProfileData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(interest)
        ? (prev[field] as string[]).filter(item => item !== interest)
        : [...(prev[field] as string[]), interest]
    }));
  };

  const renderPhotosStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Show Your Best Self</h2>
        <p className="text-muted-foreground font-prompt">Upload 1-6 photos to get more matches</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square border-2 border-dashed border-border/50 rounded-2xl flex items-center justify-center relative overflow-hidden bg-gradient-soft/20 hover:border-primary/50 transition-colors"
          >
            {profileData.photos[index] ? (
              <>
                <img
                  src={URL.createObjectURL(profileData.photos[index])}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon-sm"
                  className="absolute top-2 right-2 rounded-full shadow-medium"
                  onClick={() => removePhoto(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center hover:bg-accent/10 transition-colors rounded-2xl">
                <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground font-prompt">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="border border-border/50 rounded-2xl p-4 bg-card/50 backdrop-blur-sm">
          <Label className="flex items-center space-x-2 cursor-pointer mb-2">
            <Video className="w-5 h-5 text-primary" />
            <span className="font-semibold">Upload Video (Optional)</span>
          </Label>
          <p className="text-sm text-muted-foreground mb-3">Share a 15-second video introduction</p>
          <input type="file" accept="video/*" className="text-sm w-full" />
        </div>

        <div className="border border-border/50 rounded-2xl p-4 bg-card/50 backdrop-blur-sm">
          <Label className="flex items-center space-x-2 cursor-pointer mb-2">
            <Mic className="w-5 h-5 text-primary" />
            <span className="font-semibold">Voice Introduction (Optional)</span>
          </Label>
          <p className="text-sm text-muted-foreground mb-3">Record a voice message</p>
          <Button variant="outline" className="rounded-xl">
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Tell Us About You</h2>
        <p className="text-muted-foreground font-prompt">Basic information to get started</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="font-semibold">First Name *</Label>
          <Input
            id="firstName"
            value={profileData.firstName}
            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="font-semibold">Last Name *</Label>
          <Input
            id="lastName"
            value={profileData.lastName}
            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
            className="rounded-xl mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="dateOfBirth" className="font-semibold">Date of Birth *</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={profileData.dateOfBirth}
          onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
          className="rounded-xl mt-1"
        />
      </div>

      <div>
        <Label htmlFor="gender" className="font-semibold">Gender *</Label>
        <Select value={profileData.gender} onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}>
          <SelectTrigger className="rounded-xl mt-1">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non-binary">Non-binary</SelectItem>
            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="phone" className="font-semibold">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={profileData.phone}
          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
          className="rounded-xl mt-1"
          placeholder="Optional"
        />
      </div>

      <div>
        <Label htmlFor="college" className="font-semibold">University *</Label>
        <Input
          id="college"
          value={profileData.college}
          onChange={(e) => setProfileData(prev => ({ ...prev, college: e.target.value }))}
          className="rounded-xl mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="major" className="font-semibold">Major</Label>
          <Input
            id="major"
            value={profileData.major}
            onChange={(e) => setProfileData(prev => ({ ...prev, major: e.target.value }))}
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label htmlFor="yearOfStudy" className="font-semibold">Year of Study</Label>
          <Select value={profileData.yearOfStudy} onValueChange={(value) => setProfileData(prev => ({ ...prev, yearOfStudy: value }))}>
            <SelectTrigger className="rounded-xl mt-1">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
              <SelectItem value="5">5th Year+</SelectItem>
              <SelectItem value="graduate">Graduate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderPersonalityStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">Your Personality</h2>
        <p className="text-muted-foreground font-prompt">Help us understand who you are</p>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-primary/10">
        <Label className="font-semibold text-lg mb-3 flex items-center">
          <Heart className="w-4 h-4 mr-2 text-coral" />
          Are you more of an introvert or extrovert?
        </Label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {['Introvert', 'Extrovert'].map((type) => (
            <Button
              key={type}
              variant={profileData.introvertExtrovert === type ? 'coral' : 'outline'}
              onClick={() => setProfileData(prev => ({ ...prev, introvertExtrovert: type }))}
              className="rounded-xl h-12 font-semibold hover-lift"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-primary/10">
        <Label className="font-semibold text-lg mb-3 flex items-center">
          <Palette className="w-4 h-4 mr-2 text-secondary" />
          What's your humor style?
        </Label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {['Dark', 'Witty', 'Light', 'Sarcastic'].map((style) => (
            <Button
              key={style}
              variant={profileData.humorStyle === style ? 'coral' : 'outline'}
              onClick={() => setProfileData(prev => ({ ...prev, humorStyle: style }))}
              className="rounded-xl h-12 font-semibold hover-lift"
            >
              {style}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-primary/10">
        <Label className="font-semibold text-lg mb-3 flex items-center">
          <Heart className="w-4 h-4 mr-2 text-coral" />
          How do you express love?
        </Label>
        <div className="grid grid-cols-1 gap-2 mt-3">
          {['Words of Affirmation', 'Physical Touch', 'Quality Time', 'Acts of Service', 'Receiving Gifts'].map((language) => (
            <Button
              key={language}
              variant={profileData.loveLanguage === language ? 'coral' : 'outline'}
              onClick={() => setProfileData(prev => ({ ...prev, loveLanguage: language }))}
              className="rounded-xl h-12 font-semibold hover-lift text-sm"
            >
              {language}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-primary/10">
        <Label className="font-semibold text-lg mb-3">What are you looking for?</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Casual', 'Serious', 'Friendship', 'Marriage', 'Something Fun'].map((goal) => (
            <Badge
              key={goal}
              variant={profileData.relationshipGoals.includes(goal) ? 'default' : 'secondary'}
              className="cursor-pointer rounded-full px-4 py-2 hover:scale-105 transition-all duration-200 hover:shadow-md text-sm font-semibold"
              onClick={() => toggleInterest(goal, 'relationshipGoals')}
            >
              {goal}
            </Badge>
          ))}
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-primary/10">
        <Label className="font-semibold text-lg mb-3">Hobbies & Interests</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            'Reading', 'Gaming', 'Sports', 'Music', 'Art', 'Travel', 
            'Cooking', 'Photography', 'Dancing', 'Hiking', 'Movies', 'Fitness',
            'Netflix', 'Yoga', 'Partying', 'Study Groups'
          ].map((hobby) => (
            <Badge
              key={hobby}
              variant={profileData.hobbies.includes(hobby) ? 'default' : 'secondary'}
              className="cursor-pointer rounded-full px-3 py-1 hover:scale-105 transition-all duration-200 hover:shadow-md"
              onClick={() => toggleInterest(hobby, 'hobbies')}
            >
              {hobby}
            </Badge>
          ))}
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-primary/10">
        <Label htmlFor="bio" className="font-semibold text-lg mb-3">Describe yourself in one sentence</Label>
        <Textarea
          id="bio"
          value={profileData.bio}
          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="I'm someone who loves adventure, good coffee, and meaningful conversations..."
          className="rounded-xl mt-1 border-primary/20 focus:border-primary/50 bg-white/50"
          rows={3}
        />
      </div>
    </div>
  );

  const renderPhysicalPreferencesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-coral bg-clip-text text-transparent">Physical Preferences</h2>
        <p className="text-muted-foreground font-prompt">What attracts you physically?</p>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-coral/20">
        <Label className="font-semibold text-lg mb-3">Age Range</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Min Age</Label>
            <Input
              type="number"
              value={profileData.preferredAge.min}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                preferredAge: { ...prev.preferredAge, min: parseInt(e.target.value) || 18 }
              }))}
              className="rounded-xl mt-1"
              min="18"
              max="35"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Max Age</Label>
            <Input
              type="number"
              value={profileData.preferredAge.max}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                preferredAge: { ...prev.preferredAge, max: parseInt(e.target.value) || 30 }
              }))}
              className="rounded-xl mt-1"
              min="18"
              max="35"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-coral/20">
        <Label className="font-semibold text-lg mb-3">Height Preference</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Min Height (cm)</Label>
            <Input
              type="number"
              value={profileData.preferredHeight.min}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                preferredHeight: { ...prev.preferredHeight, min: parseInt(e.target.value) || 150 }
              }))}
              className="rounded-xl mt-1"
              min="140"
              max="220"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Max Height (cm)</Label>
            <Input
              type="number"
              value={profileData.preferredHeight.max}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                preferredHeight: { ...prev.preferredHeight, max: parseInt(e.target.value) || 200 }
              }))}
              className="rounded-xl mt-1"
              min="140"
              max="220"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-coral/20">
        <Label className="font-semibold text-lg mb-3">Skin Type Preference</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Fair', 'Wheatish', 'Dark', "Doesn't Matter"].map((skin) => (
            <Badge
              key={skin}
              variant={profileData.preferredSkinType.includes(skin) ? 'default' : 'secondary'}
              className="cursor-pointer rounded-full px-4 py-2 hover:scale-105 transition-all duration-200 hover:shadow-md"
              onClick={() => toggleInterest(skin, 'preferredSkinType')}
            >
              {skin}
            </Badge>
          ))}
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-coral/20">
        <Label className="font-semibold text-lg mb-3">Body Shape Preference</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Slim', 'Fit', 'Athletic', 'Average', 'Curvy', "Doesn't Matter"].map((shape) => (
            <Badge
              key={shape}
              variant={profileData.preferredBodyShape.includes(shape) ? 'default' : 'secondary'}
              className="cursor-pointer rounded-full px-4 py-2 hover:scale-105 transition-all duration-200 hover:shadow-md"
              onClick={() => toggleInterest(shape, 'preferredBodyShape')}
            >
              {shape}
            </Badge>
          ))}
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-coral/20">
        <Label className="font-semibold text-lg mb-3">Lifestyle Preferences</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Fitness Enthusiast', 'Non-Smoker', 'Social Drinker', 'Vegetarian', 'Vegan', 'Foodie', 'Party Lover', 'Homebody'].map((lifestyle) => (
            <Badge
              key={lifestyle}
              variant={profileData.preferredLifestyle.includes(lifestyle) ? 'default' : 'secondary'}
              className="cursor-pointer rounded-full px-3 py-1 hover:scale-105 transition-all duration-200 hover:shadow-md"
              onClick={() => toggleInterest(lifestyle, 'preferredLifestyle')}
            >
              {lifestyle}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMentalPreferencesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-secondary bg-clip-text text-transparent">Mental Connection</h2>
        <p className="text-muted-foreground font-prompt">What matters to you mentally?</p>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-secondary/20">
        <Label className="font-semibold text-lg mb-3">Preferred Humor Style</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Dark', 'Witty', 'Light', 'Sarcastic', "Doesn't Matter"].map((humor) => (
            <Badge
              key={humor}
              variant={profileData.preferredHumor.includes(humor) ? 'default' : 'secondary'}
              className="cursor-pointer rounded-full px-4 py-2 hover:scale-105 transition-all duration-200 hover:shadow-md"
              onClick={() => toggleInterest(humor, 'preferredHumor')}
            >
              {humor}
            </Badge>
          ))}
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-secondary/20">
        <Label className="font-semibold text-lg mb-3">Personality Type</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Introvert', 'Extrovert', 'Ambivert', "Doesn't Matter"].map((personality) => (
            <Badge
              key={personality}
              variant={profileData.preferredPersonality.includes(personality) ? 'default' : 'secondary'}
              className="cursor-pointer rounded-full px-4 py-2 hover:scale-105 transition-all duration-200 hover:shadow-md"
              onClick={() => toggleInterest(personality, 'preferredPersonality')}
            >
              {personality}
            </Badge>
          ))}
        </div>
      </div>

      <div className="bg-gradient-soft/10 rounded-2xl p-4 border border-secondary/20">
        <Label className="font-semibold text-lg mb-3">Values & Priorities</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            'Career-Focused', 'Family-Oriented', 'Spiritual', 'Open-Minded', 
            'Ambitious', 'Creative', 'Intellectual', 'Adventure-Seeking',
            'Compassionate', 'Independent'
          ].map((value) => (
            <Badge
              key={value}
              variant={profileData.preferredValues.includes(value) ? 'default' : 'secondary'}
              className="cursor-pointer rounded-full px-3 py-1 hover:scale-105 transition-all duration-200 hover:shadow-md"
              onClick={() => toggleInterest(value, 'preferredValues')}
            >
              {value}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">Profile Complete!</h2>
        <p className="text-muted-foreground font-prompt">Review your profile before continuing</p>
      </div>

      <div className="bg-gradient-soft/20 rounded-2xl p-6 border border-primary/20">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {profileData.photos.slice(0, 2).map((photo, index) => (
            <div key={index} className="aspect-square rounded-xl overflow-hidden">
              <img
                src={URL.createObjectURL(photo)}
                alt={`Profile ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">{profileData.firstName} {profileData.lastName}</h3>
          <p className="text-muted-foreground mb-4">{profileData.college} • {profileData.yearOfStudy} Year</p>
          <p className="text-sm bg-card/50 rounded-lg p-3 border">{profileData.bio}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card/50 rounded-xl p-4 border">
          <h4 className="font-semibold mb-2 text-primary">Personality</h4>
          <p className="text-sm text-muted-foreground">{profileData.introvertExtrovert}</p>
          <p className="text-sm text-muted-foreground">{profileData.humorStyle} humor</p>
          <p className="text-sm text-muted-foreground">{profileData.loveLanguage}</p>
        </div>
        
        <div className="bg-card/50 rounded-xl p-4 border">
          <h4 className="font-semibold mb-2 text-coral">Interests</h4>
          <div className="flex flex-wrap gap-1">
            {profileData.hobbies.slice(0, 3).map((hobby, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {hobby}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profileData.photos.length >= 1;
      case 2:
        return profileData.firstName && profileData.lastName && profileData.dateOfBirth && 
               profileData.gender && profileData.college;
      case 3:
        return profileData.introvertExtrovert && profileData.hobbies.length > 0 && profileData.bio.length > 10;
      case 4:
        return profileData.preferredSkinType.length > 0 || profileData.preferredBodyShape.length > 0;
      case 5:
        return profileData.preferredHumor.length > 0 || profileData.preferredPersonality.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="hover:bg-white/20 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-muted-foreground font-prompt">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        <Progress value={(currentStep / totalSteps) * 100} className="mb-8 rounded-full" />

        <Card className="shadow-elegant border-0 bg-card/70 backdrop-blur-md mb-6 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            {currentStep === 1 && renderPhotosStep()}
            {currentStep === 2 && renderBasicInfoStep()}
            {currentStep === 3 && renderPersonalityStep()}
            {currentStep === 4 && renderPhysicalPreferencesStep()}
            {currentStep === 5 && renderMentalPreferencesStep()}
            {currentStep === 6 && renderReviewStep()}
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 rounded-xl h-12 font-semibold border-primary/30 hover:border-primary/50"
            >
              Previous
            </Button>
          )}
          
          {currentStep < 6 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="flex-1 rounded-xl h-12 font-semibold shadow-glow hover-lift"
              variant="coral"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              className="flex-1 rounded-xl h-12 font-semibold shadow-glow hover-lift"
              variant="coral"
            >
              Complete Profile
              <Heart className="w-4 h-4 ml-2 animate-pulse" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedProfileCreation;