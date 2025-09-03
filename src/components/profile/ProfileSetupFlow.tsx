import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BasicDetailsStep from "./steps/BasicDetailsStep";
import WhatYouAreStep from "./steps/WhatYouAreStep";
import WhoYouWantStep from "./steps/WhoYouWantStep";
import UploadPhotosStep from "./steps/UploadPhotosStep";
import IDVerificationStep from "./steps/IDVerificationStep";
import ProgressIndicator from "./steps/ProgressIndicator";

interface ProfileSetupFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

const ProfileSetupFlow = ({ onBack, onComplete }: ProfileSetupFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Profile Data State
  const [profileData, setProfileData] = useState({
    // Basic Details
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    university: "",
    yearOfStudy: "",
    fieldOfStudy: "",
    
    // What You Are
    height: "",
    bodyType: "",
    skinTone: "",
    personalityType: "",
    values: "",
    mindset: "",
    relationshipGoals: [] as string[],
    interests: [] as string[],
    bio: "",
    
    // Who You Want
    preferredGender: [] as string[],
    ageRangeMin: 18,
    ageRangeMax: 30,
    heightRangeMin: 150,
    heightRangeMax: 200,
    preferredBodyTypes: [] as string[],
    preferredValues: [] as string[],
    preferredMindset: [] as string[],
    preferredPersonality: [] as string[],
    preferredRelationshipGoals: [] as string[],
    
    // Photos
    profileImages: [] as File[],
    
    // Settings
    isProfilePublic: true
  });

  const totalSteps = 5;
  const stepTitles = [
    "Basic Details",
    "What You Are", 
    "Who You Want",
    "Upload Photos",
    "ID Verification"
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      
      // Create mock user ID
      const mockUserId = `demo_user_${Date.now()}`;
      
      // Create mock image URLs for demo
      const imageUrls: string[] = profileData.profileImages.map((_, index) => 
        `https://via.placeholder.com/400x600?text=Photo+${index + 1}`
      );

      // Store complete profile data
      const completeProfile = {
        user_id: mockUserId,
        // Basic info
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender,
        university: profileData.university,
        year_of_study: profileData.yearOfStudy,
        field_of_study: profileData.fieldOfStudy,
        
        // What you are
        height: profileData.height,
        body_type: profileData.bodyType,
        skin_tone: profileData.skinTone,
        personality_type: profileData.personalityType,
        values: profileData.values,
        mindset: profileData.mindset,
        relationship_goals: profileData.relationshipGoals,
        interests: profileData.interests,
        bio: profileData.bio,
        
        // Images and settings
        profile_images: imageUrls,
        is_profile_public: profileData.isProfilePublic,
        verification_status: 'pending',
        college_tier: 'tier3',
        subscription_tier: 'free',
        swipes_left: 10
      };

      // Store partner preferences
      const preferences = {
        user_id: mockUserId,
        preferred_gender: profileData.preferredGender,
        age_range_min: profileData.ageRangeMin,
        age_range_max: profileData.ageRangeMax,
        height_range_min: profileData.heightRangeMin,
        height_range_max: profileData.heightRangeMax,
        preferred_body_types: profileData.preferredBodyTypes,
        preferred_values: profileData.preferredValues,
        preferred_mindset: profileData.preferredMindset,
        preferred_personality: profileData.preferredPersonality,
        preferred_relationship_goal: profileData.preferredRelationshipGoals
      };

      // Save to localStorage
      localStorage.setItem('demoProfile', JSON.stringify(completeProfile));
      localStorage.setItem('demoPreferences', JSON.stringify(preferences));
      localStorage.setItem('demoUserId', mockUserId);

      toast({
        title: "Profile created successfully! ✨",
        description: "Your profile is ready for the next step"
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

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Basic Details
        return profileData.firstName && profileData.lastName && profileData.dateOfBirth && 
               profileData.gender && profileData.university;
      case 2: // What You Are
        return profileData.personalityType && profileData.values && profileData.bio;
      case 3: // Who You Want
        return profileData.preferredGender.length > 0 && profileData.preferredRelationshipGoals.length > 0;
      case 4: // Upload Photos
        return profileData.profileImages.length >= 1;
      case 5: // ID Verification
        return true; // Can always proceed from verification
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicDetailsStep
            data={profileData}
            onChange={setProfileData}
          />
        );
      case 2:
        return (
          <WhatYouAreStep
            data={profileData}
            onChange={setProfileData}
          />
        );
      case 3:
        return (
          <WhoYouWantStep
            data={profileData}
            onChange={setProfileData}
          />
        );
      case 4:
        return (
          <UploadPhotosStep
            data={profileData}
            onChange={setProfileData}
          />
        );
      case 5:
        return (
          <IDVerificationStep
            data={profileData}
            onChange={setProfileData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-elegant bg-gradient-card backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className="rounded-full w-10 h-10 p-0 hover:bg-primary/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="text-sm text-muted-foreground font-prompt">
                Step {currentStep} of {totalSteps}
              </div>
              
              <div className="w-10" /> {/* Spacer */}
            </div>

            <ProgressIndicator 
              currentStep={currentStep} 
              totalSteps={totalSteps}
              stepTitles={stepTitles}
            />
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {stepTitles[currentStep - 1]}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-8 space-y-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex space-x-4 pt-6">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : currentStep === totalSteps ? (
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>Complete Profile</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetupFlow;