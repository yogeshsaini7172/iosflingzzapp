import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Upload, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DetailedProfileCreationProps {
  onComplete: () => void;
  onBack: () => void;
}

interface ProfileData {
  // Basic Info
  photos: File[];
  bio: string;
  height: number;
  
  // Lifestyle
  smoking: string;
  drinking: string;
  fitness: string;
  diet: string;
  
  // Personality & Preferences
  personalityType: string;
  humorType: string;
  loveLanguage: string;
  relationshipGoals: string[];
  
  // Interests
  interests: string[];
  
  // Compatibility Preferences
  ageRange: [number, number];
  heightPreference: string;
  genderPreference: string;
}

const DetailedProfileCreation = ({ onComplete, onBack }: DetailedProfileCreationProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    photos: [],
    bio: "",
    height: 170,
    smoking: "",
    drinking: "",
    fitness: "",
    diet: "",
    personalityType: "",
    humorType: "",
    loveLanguage: "",
    relationshipGoals: [],
    interests: [],
    ageRange: [18, 25],
    heightPreference: "",
    genderPreference: ""
  });
  const { toast } = useToast();

  const availableInterests = [
    "Movies", "Music", "Travel", "Reading", "Gaming", "Sports", "Cooking", "Art",
    "Photography", "Dancing", "Hiking", "Yoga", "Technology", "Fashion", "Food",
    "Netflix", "Anime", "Books", "Fitness", "Adventure", "Coffee", "Pets"
  ];

  const relationshipGoalOptions = ["Casual dating", "Serious relationship", "Marriage", "Friendship", "Networking"];

  const handlePhotoUpload = (files: FileList) => {
    const newPhotos = Array.from(files).slice(0, 6 - profileData.photos.length);
    setProfileData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
    toast({ title: `${newPhotos.length} photo(s) uploaded` });
  };

  const removePhoto = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const toggleInterest = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleRelationshipGoal = (goal: string) => {
    setProfileData(prev => ({
      ...prev,
      relationshipGoals: prev.relationshipGoals.includes(goal)
        ? prev.relationshipGoals.filter(g => g !== goal)
        : [...prev.relationshipGoals, goal]
    }));
  };

  const renderPhotosStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Your Photos</CardTitle>
        <CardDescription>Upload up to 6 photos to showcase your personality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {profileData.photos.map((photo, index) => (
            <div key={index} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <img 
                src={URL.createObjectURL(photo)} 
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => removePhoto(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {profileData.photos.length < 6 && (
            <label className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Add Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
              />
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderBasicInfoStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Tell us more about yourself</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Write something interesting about yourself..."
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            className="min-h-[100px]"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Height: {profileData.height} cm</Label>
          <Slider
            value={[profileData.height]}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, height: value[0] }))}
            max={220}
            min={140}
            step={1}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Smoking</Label>
            <Select value={profileData.smoking} onValueChange={(value) => setProfileData(prev => ({ ...prev, smoking: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="occasionally">Occasionally</SelectItem>
                <SelectItem value="regularly">Regularly</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Drinking</Label>
            <Select value={profileData.drinking} onValueChange={(value) => setProfileData(prev => ({ ...prev, drinking: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="socially">Socially</SelectItem>
                <SelectItem value="regularly">Regularly</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fitness</Label>
            <Select value={profileData.fitness} onValueChange={(value) => setProfileData(prev => ({ ...prev, fitness: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very-active">Very Active</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Diet</Label>
            <Select value={profileData.diet} onValueChange={(value) => setProfileData(prev => ({ ...prev, diet: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="jain">Jain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPersonalityStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Personality & Traits</CardTitle>
        <CardDescription>Help us understand your personality better</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Personality Type</Label>
          <RadioGroup 
            value={profileData.personalityType} 
            onValueChange={(value) => setProfileData(prev => ({ ...prev, personalityType: value }))}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="introvert" id="introvert" />
              <Label htmlFor="introvert">Introvert</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="extrovert" id="extrovert" />
              <Label htmlFor="extrovert">Extrovert</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ambivert" id="ambivert" />
              <Label htmlFor="ambivert">Ambivert</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Humor Type</Label>
          <Select value={profileData.humorType} onValueChange={(value) => setProfileData(prev => ({ ...prev, humorType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select your humor style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="witty">Witty & Clever</SelectItem>
              <SelectItem value="sarcastic">Sarcastic</SelectItem>
              <SelectItem value="playful">Playful & Silly</SelectItem>
              <SelectItem value="dry">Dry Humor</SelectItem>
              <SelectItem value="wholesome">Wholesome & Sweet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Love Language</Label>
          <Select value={profileData.loveLanguage} onValueChange={(value) => setProfileData(prev => ({ ...prev, loveLanguage: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="How do you express love?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="words">Words of Affirmation</SelectItem>
              <SelectItem value="quality-time">Quality Time</SelectItem>
              <SelectItem value="physical-touch">Physical Touch</SelectItem>
              <SelectItem value="acts-of-service">Acts of Service</SelectItem>
              <SelectItem value="gifts">Receiving Gifts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>What are you looking for?</Label>
          <div className="flex flex-wrap gap-2">
            {relationshipGoalOptions.map((goal) => (
              <Badge
                key={goal}
                variant={profileData.relationshipGoals.includes(goal) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleRelationshipGoal(goal)}
              >
                {goal}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderInterestsStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Interests & Hobbies</CardTitle>
        <CardDescription>Select things you're passionate about</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Select your interests (choose at least 3)</Label>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => (
              <Badge
                key={interest}
                variant={profileData.interests.includes(interest) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Selected: {profileData.interests.length}/22
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreferencesStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Preferences</CardTitle>
        <CardDescription>Tell us what you're looking for in a partner</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Gender Preference</Label>
          <Select value={profileData.genderPreference} onValueChange={(value) => setProfileData(prev => ({ ...prev, genderPreference: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="everyone">Everyone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Age Range: {profileData.ageRange[0]} - {profileData.ageRange[1]} years</Label>
          <div className="px-2">
            <Slider
              value={profileData.ageRange}
              onValueChange={(value) => setProfileData(prev => ({ ...prev, ageRange: value as [number, number] }))}
              max={35}
              min={18}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Height Preference</Label>
          <Select value={profileData.heightPreference} onValueChange={(value) => setProfileData(prev => ({ ...prev, heightPreference: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shorter">Shorter than me</SelectItem>
              <SelectItem value="similar">Similar to my height</SelectItem>
              <SelectItem value="taller">Taller than me</SelectItem>
              <SelectItem value="no-preference">No preference</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const totalSteps = 5;
  const canProceed = {
    1: profileData.photos.length >= 2,
    2: profileData.bio.length >= 20 && profileData.smoking && profileData.drinking,
    3: profileData.personalityType && profileData.humorType && profileData.loveLanguage,
    4: profileData.interests.length >= 3,
    5: profileData.genderPreference && profileData.heightPreference
  };

  return (
    <div className="min-h-screen bg-gradient-soft py-8 px-4">
      {/* Progress Indicator */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Profile Setup</h2>
          <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderPhotosStep()}
      {currentStep === 2 && renderBasicInfoStep()}
      {currentStep === 3 && renderPersonalityStep()}
      {currentStep === 4 && renderInterestsStep()}
      {currentStep === 5 && renderPreferencesStep()}

      {/* Navigation */}
      <div className="max-w-2xl mx-auto mt-8 flex gap-4">
        <Button 
          variant="outline" 
          onClick={currentStep === 1 ? onBack : () => setCurrentStep(prev => prev - 1)}
          className="flex-1"
        >
          {currentStep === 1 ? 'Back' : 'Previous'}
        </Button>
        <Button 
          onClick={currentStep === totalSteps ? onComplete : () => setCurrentStep(prev => prev + 1)}
          disabled={!canProceed[currentStep as keyof typeof canProceed]}
          className="flex-1"
        >
          {currentStep === totalSteps ? 'Complete Profile' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default DetailedProfileCreation;