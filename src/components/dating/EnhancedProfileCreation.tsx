import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Upload, Plus, X, Loader2 } from "lucide-react";
import ProgressIndicator from "../onboarding/ProgressIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";

interface EnhancedProfileCreationProps {
  onComplete: () => void;
  onBack?: () => void;
}

const EnhancedProfileCreation = ({ onComplete, onBack }: EnhancedProfileCreationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    university: '',
    major: '',
    yearOfStudy: '',
    photos: [] as string[],
    selectedPrompts: [] as string[],
    prompts: {} as Record<string, string>,
    selectedInterests: [] as string[],
    preferences: {
      lookingFor: '',
      gender: ''
    }
  });

  const totalSteps = 4;
  const stepTitles = [
    "Basic Info",
    "Add Photo", 
    "Your Personality",
    "Preferences"
  ];

  const prompts = [
    "My ideal first date is...",
    "I'm looking for someone who...",
    "My biggest passion is...",
    "I can't live without...",
    "My friends would describe me as...",
    "The way to my heart is..."
  ];

  const interests = [
    "Photography", "Music", "Sports", "Reading", "Cooking", "Travel",
    "Gaming", "Art", "Dancing", "Fitness", "Movies", "Technology",
    "Fashion", "Food", "Nature", "Pets", "Writing", "Volunteering"
  ];

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to create a profile",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare bio from prompts
      const bio = formData.selectedPrompts
        .map(prompt => `${prompt} ${formData.prompts[prompt] || ''}`)
        .join('\n\n');

      const profileData = {
        userId: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        university: formData.university,
        fieldOfStudy: formData.major,
        yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined,
        bio: bio,
        profileImages: formData.photos,
        interests: formData.selectedInterests,
        relationshipGoals: [formData.preferences.lookingFor],
        isProfilePublic: true,
        email: user.email || '',
        preferences: {
          preferredGender: formData.preferences.gender === 'all' 
            ? ['male', 'female', 'non_binary'] 
            : [formData.preferences.gender],
          ageRangeMin: 18,
          ageRangeMax: 30,
        },
      };

      console.log('Submitting profile data:', profileData);

      const response = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/profile-completion',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create profile');
      }

      const result = await response.json();
      console.log('Profile created successfully:', result);

      toast({
        title: "Profile Created! 🎉",
        description: "Your profile has been created successfully",
      });

      onComplete();
    } catch (error) {
      console.error('Profile creation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const addPrompt = (prompt: string) => {
    if (formData.selectedPrompts.length < 3) {
      setFormData({
        ...formData,
        selectedPrompts: [...formData.selectedPrompts, prompt]
      });
    }
  };

  const removePrompt = (prompt: string) => {
    setFormData({
      ...formData,
      selectedPrompts: formData.selectedPrompts.filter(p => p !== prompt),
      prompts: { ...formData.prompts, [prompt]: "" }
    });
  };

  const toggleInterest = (interest: string) => {
    const selected = formData.selectedInterests;
    if (selected.includes(interest)) {
      setFormData({
        ...formData,
        selectedInterests: selected.filter(i => i !== interest)
      });
    } else if (selected.length < 10) {
      setFormData({
        ...formData,
        selectedInterests: [...selected, interest]
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="e.g., Stanford University"
                className="bg-muted/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="e.g., Computer Science"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Year of Study</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, yearOfStudy: value })}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Add Your Photo</h3>
              <p className="text-sm text-muted-foreground">Upload your main profile photo. Only one image allowed here.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <label htmlFor="main-photo-upload" className="cursor-pointer">
                {formData.photos[0] ? (
                  <img
                    src={formData.photos[0]}
                    alt="Main Profile"
                    className="w-40 h-40 rounded-full object-cover border-4 border-primary shadow"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary">
                    <Upload className="w-14 h-14 text-primary" />
                  </div>
                )}
                <input
                  id="main-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, photos: [reader.result as string] });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  disabled={!!formData.photos[0]}
                />
              </label>
              <span className="text-lg font-semibold mt-2">Main Photo</span>
              <span className="text-sm text-muted-foreground">Upload only 1 photo as your main profile image</span>
              {formData.photos[0] && (
                <Button size="sm" variant="destructive" onClick={() => setFormData({ ...formData, photos: [] })}>
                  Remove Photo
                </Button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Choose Your Prompts</h3>
                <p className="text-sm text-muted-foreground">Select up to 3 prompts to showcase your personality</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {prompts.map((prompt) => (
                  <Card
                    key={prompt}
                    className={`cursor-pointer transition-all duration-200 ${
                      formData.selectedPrompts.includes(prompt)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => 
                      formData.selectedPrompts.includes(prompt) 
                        ? removePrompt(prompt) 
                        : addPrompt(prompt)
                    }
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="text-sm font-medium">{prompt}</span>
                      {formData.selectedPrompts.includes(prompt) ? (
                        <X className="w-4 h-4 text-primary" />
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {formData.selectedPrompts.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">Your Responses</h4>
                {formData.selectedPrompts.map((prompt) => (
                  <div key={prompt} className="space-y-2">
                    <Label className="text-sm text-primary">{prompt}</Label>
                    <Textarea
                      value={formData.prompts[prompt] || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        prompts: { ...formData.prompts, [prompt]: e.target.value }
                      })}
                      placeholder="Your answer..."
                      className="bg-muted/50"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-semibold">Your Interests</h4>
              <p className="text-sm text-muted-foreground">Select up to 10 interests</p>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={formData.selectedInterests.includes(interest) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 ${
                      formData.selectedInterests.includes(interest)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-primary/10'
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Your Preferences</h3>
              <p className="text-sm text-muted-foreground">Help us find your perfect match</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Looking for</Label>
                <Select onValueChange={(value) => setFormData({
                  ...formData,
                  preferences: { ...formData.preferences, lookingFor: value }
                })}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="What are you looking for?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relationship">Long-term relationship</SelectItem>
                    <SelectItem value="dating">Dating</SelectItem>
                    <SelectItem value="friends">New friends</SelectItem>
                    <SelectItem value="casual">Something casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Interested in</Label>
                <Select onValueChange={(value) => setFormData({
                  ...formData,
                  preferences: { ...formData.preferences, gender: value }
                })}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Gender preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Men</SelectItem>
                    <SelectItem value="female">Women</SelectItem>
                    <SelectItem value="all">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepTitles={stepTitles}
          />
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {stepTitles[currentStep - 1]}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="bg-gradient-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                {currentStep === totalSteps ? "Complete Profile" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfileCreation;