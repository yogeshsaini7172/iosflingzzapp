import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { User, Heart, Brain, GraduationCap, Camera, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  // Basic Info
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  location: string;
  bio: string;
  
  // Physical Qualities
  height: string;
  bodyType: string;
  skinTone: string;
  faceType: string;
  
  // Mental Qualities
  values: string;
  mindset: string;
  personality: string;
  relationshipGoal: string;
  
  // Lifestyle
  yearOfStudy: string;
  fieldOfStudy: string;
  university: string;
}

interface ComprehensiveProfileCreationProps {
  onComplete: () => void;
}

const ComprehensiveProfileCreation = ({ onComplete }: ComprehensiveProfileCreationProps) => {
  console.log('ComprehensiveProfileCreation component rendered');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    location: '',
    bio: '',
    height: '',
    bodyType: '',
    skinTone: '',
    faceType: '',
    values: '',
    mindset: '',
    personality: '',
    relationshipGoal: '',
    yearOfStudy: '',
    fieldOfStudy: '',
    university: ''
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateProfileData = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to continue');
        return;
      }

      // Calculate age-based date of birth
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(profileData.age);
      const dateOfBirth = `${birthYear}-01-01`;

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: user.email || '',
          bio: profileData.bio,
          date_of_birth: dateOfBirth,
          gender: profileData.gender as any,
          location: profileData.location,
          height: parseInt(profileData.height) || null,
          body_type: profileData.bodyType,
          skin_tone: profileData.skinTone,
          face_type: profileData.faceType,
          values: profileData.values,
          mindset: profileData.mindset,
          personality_type: profileData.personality,
          relationship_goals: [profileData.relationshipGoal],
          year_of_study: parseInt(profileData.yearOfStudy) || null,
          field_of_study: profileData.fieldOfStudy,
          university: profileData.university,
          is_profile_public: true,
          is_active: true
        });

      if (error) {
        console.error('Profile creation error:', error);
        toast.error('Failed to create profile. Please try again.');
      } else {
        toast.success('Profile created successfully! 🎉');
        onComplete();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={profileData.firstName}
            onChange={(e) => updateProfileData('firstName', e.target.value)}
            placeholder="Enter your first name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={profileData.lastName}
            onChange={(e) => updateProfileData('lastName', e.target.value)}
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            min="18"
            max="100"
            value={profileData.age}
            onChange={(e) => updateProfileData('age', e.target.value)}
            placeholder="25"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select onValueChange={(value) => updateProfileData('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non_binary">Non-binary</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={profileData.location}
          onChange={(e) => updateProfileData('location', e.target.value)}
          placeholder="City / Campus"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={profileData.bio}
          onChange={(e) => updateProfileData('bio', e.target.value)}
          placeholder="Tell us about yourself..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderPhysicalQualities = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-3">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Physical Qualities</h2>
        <p className="text-muted-foreground">Your physical preferences</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            min="140"
            max="220"
            value={profileData.height}
            onChange={(e) => updateProfileData('height', e.target.value)}
            placeholder="170"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bodyType">Body Type</Label>
          <Select onValueChange={(value) => updateProfileData('bodyType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select body type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="slim">Slim</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="athletic">Athletic</SelectItem>
              <SelectItem value="curvy">Curvy</SelectItem>
              <SelectItem value="plus_size">Plus-size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="skinTone">Skin Tone</Label>
          <Select onValueChange={(value) => updateProfileData('skinTone', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select skin tone" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="wheatish">Wheatish</SelectItem>
              <SelectItem value="dusky">Dusky</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="faceType">Face Type</Label>
          <Select onValueChange={(value) => updateProfileData('faceType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select face type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="round">Round</SelectItem>
              <SelectItem value="oval">Oval</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="heart">Heart</SelectItem>
              <SelectItem value="diamond">Diamond</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderMentalQualities = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-accent to-secondary rounded-full flex items-center justify-center mx-auto mb-3">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Mental Qualities</h2>
        <p className="text-muted-foreground">Your personality and values</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="values">Values</Label>
          <Select onValueChange={(value) => updateProfileData('values', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select values" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="traditional">Traditional</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mindset">Mindset</Label>
          <Select onValueChange={(value) => updateProfileData('mindset', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select mindset" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="optimistic">Optimistic</SelectItem>
              <SelectItem value="realistic">Realistic</SelectItem>
              <SelectItem value="ambitious">Ambitious</SelectItem>
              <SelectItem value="easy_going">Easy-going</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="personality">Personality</Label>
          <Select onValueChange={(value) => updateProfileData('personality', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select personality" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="introvert">Introvert</SelectItem>
              <SelectItem value="extrovert">Extrovert</SelectItem>
              <SelectItem value="ambivert">Ambivert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="relationshipGoal">Relationship Goal</Label>
          <Select onValueChange={(value) => updateProfileData('relationshipGoal', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select goal" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="friendship">Friendship</SelectItem>
              <SelectItem value="casual_dating">Casual Dating</SelectItem>
              <SelectItem value="serious_relationship">Serious Relationship</SelectItem>
              <SelectItem value="marriage">Marriage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderLifestyle = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-3">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Lifestyle & Education</h2>
        <p className="text-muted-foreground">Your academic journey</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="university">University</Label>
          <Input
            id="university"
            value={profileData.university}
            onChange={(e) => updateProfileData('university', e.target.value)}
            placeholder="Enter your university name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="yearOfStudy">Year of Study</Label>
            <Select onValueChange={(value) => updateProfileData('yearOfStudy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
                <SelectItem value="5">Postgrad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fieldOfStudy">Field of Study</Label>
            <Input
              id="fieldOfStudy"
              value={profileData.fieldOfStudy}
              onChange={(e) => updateProfileData('fieldOfStudy', e.target.value)}
              placeholder="Computer Science, etc."
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderPhysicalQualities();
      case 3:
        return renderMentalQualities();
      case 4:
        return renderLifestyle();
      default:
        return renderBasicInfo();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return profileData.firstName && profileData.lastName && profileData.age && profileData.gender;
      case 2:
        return profileData.height && profileData.bodyType;
      case 3:
        return profileData.values && profileData.mindset && profileData.personality && profileData.relationshipGoal;
      case 4:
        return profileData.university && profileData.fieldOfStudy;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Create Your Profile
          </CardTitle>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderCurrentStep()}
          
          <div className="flex justify-between gap-3 pt-4">
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Back
              </Button>
            )}
            
            {currentStep < totalSteps ? (
              <Button 
                onClick={nextStep} 
                disabled={!isStepValid()}
                className={`flex-1 bg-gradient-primary ${currentStep === 1 ? 'w-full' : ''}`}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!isStepValid() || isSubmitting}
                className="flex-1 bg-gradient-primary"
              >
                {isSubmitting ? (
                  <>Creating Profile...</>
                ) : (
                  <>
                    Complete <Check className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveProfileCreation;