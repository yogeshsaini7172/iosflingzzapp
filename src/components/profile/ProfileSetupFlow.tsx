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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileSetupFlowProps {
  onComplete: () => void;
}

const ProfileSetupFlow = ({ onComplete }: ProfileSetupFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'verified' | 'failed'>('idle');
  const { toast } = useToast();
  const { user } = useAuth();

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
    faceType: "",
    personalityType: "",
    values: "",
    mindset: "",
    loveLanguage: "",
    lifestyle: "",
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
    preferredSkinTone: [] as string[],
    preferredFaceType: [] as string[],
    preferredValues: [] as string[],
    preferredMindset: [] as string[],
    preferredPersonality: [] as string[],
    preferredLoveLanguage: [] as string[],
    preferredLifestyle: [] as string[],
    preferredRelationshipGoals: [] as string[],
    
    // Photos
    profileImages: [] as File[],
    
    // Settings
    isProfilePublic: true,
    
    // ID Verification
    collegeIdFile: null as File | null,
    govtIdFile: null as File | null
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
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      
      // Require authenticated user
      if (!user) {
        toast({ title: "Please sign in first", description: "Login before completing your profile.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const userId = user.uid;
      
      // Create mock image URLs for demo
      const imageUrls: string[] = profileData.profileImages.map((_, index) => 
        `https://via.placeholder.com/400x600?text=Photo+${index + 1}`
      );

      // Store complete profile data
      const completeProfile = {
        user_id: userId,
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

      // Store partner preferences (optional, kept in localStorage for demo)
      const preferences = {
        user_id: userId,
        preferred_gender: profileData.preferredGender,
        age_range_min: profileData.ageRangeMin,
        age_range_max: profileData.ageRangeMax,
        height_range_min: profileData.heightRangeMin,
        height_range_max: profileData.heightRangeMax,
        preferred_body_types: profileData.preferredBodyTypes,
        preferred_values: profileData.preferredValues,
        preferred_mindset: profileData.preferredMindset,
        preferred_personality: profileData.preferredPersonality,
        preferred_skin_tone: profileData.preferredSkinTone,
        preferred_face_type: profileData.preferredFaceType,
        preferred_love_language: profileData.preferredLoveLanguage,
        preferred_lifestyle: profileData.preferredLifestyle,
      };

      localStorage.setItem('demoPreferences', JSON.stringify(preferences));
      localStorage.setItem('demoProfile', JSON.stringify(completeProfile));
      localStorage.setItem('demoUserId', userId);

      // Guard: ensure verification was successful
      if (verificationStatus !== 'verified') {
        toast({
          title: "Verification required",
          description: "Please submit your IDs and verify before completing.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Persist current verification status
      completeProfile.verification_status = 'verified';
      localStorage.setItem('demoProfile', JSON.stringify(completeProfile));


      // Calculate QCS via Edge Function (uses profile data)
      toast({ title: "Calculating QCS Score... 📊", description: "Analyzing your profile" });

      const physical = `${profileData.bodyType || 'average'} ${Number(profileData.height) > 170 ? 'tall' : 'average'}`.trim();
      const mental = `${profileData.personalityType || 'calm'} ${profileData.interests?.includes('fitness') ? 'ambitious' : 'logical'}`.trim();
      const description = profileData.bio || 'No description available';

      const { data: qcsResponse, error: qcsError } = await supabase.functions.invoke('qcs-scoring', {
        body: { user_id: userId, physical, mental, description }
      });

      if (qcsError) {
        throw qcsError;
      }

      const totalScore = qcsResponse?.qcs_score ?? 0;
      const qcsScore = {
        user_id: userId,
        profile_score: Math.floor(totalScore * 0.4),
        college_tier: 85,
        personality_depth: Math.floor(totalScore * 0.3),
        behavior_score: Math.floor(totalScore * 0.3),
        total_score: totalScore
      };

      localStorage.setItem('demoQCS', JSON.stringify(qcsScore));
      // After QCS success, update profile via Edge Function (service role)
      const { data: profileResult, error: profileError } = await supabase.functions.invoke('profile-completion', {
        body: {
          userId,
          email: user?.email || `${userId}@firebase.user`,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender,
          university: profileData.university,
          yearOfStudy: profileData.yearOfStudy ? Number(profileData.yearOfStudy) : null,
          fieldOfStudy: profileData.fieldOfStudy,
          height: profileData.height ? Number(profileData.height) : null,
          bodyType: profileData.bodyType,
          faceType: profileData.faceType,
          personalityType: profileData.personalityType,
          values: profileData.values,
          loveLanguage: profileData.loveLanguage,
          lifestyle: profileData.lifestyle,
          relationshipGoals: profileData.relationshipGoals,
          interests: profileData.interests,
          bio: profileData.bio,
          profileImages: imageUrls,
          isProfilePublic: profileData.isProfilePublic,
          qcsScore: totalScore,
          preferences: {
            preferredGender: profileData.preferredGender,
            ageRangeMin: profileData.ageRangeMin,
            ageRangeMax: profileData.ageRangeMax,
            preferredRelationshipGoals: profileData.preferredRelationshipGoals,
            // Add physical preferences for requirements matching
            heightRangeMin: profileData.heightRangeMin,
            heightRangeMax: profileData.heightRangeMax, 
            preferredSkinTone: profileData.preferredSkinTone,
            preferredFaceType: profileData.preferredFaceType,
            preferredLoveLanguage: profileData.preferredLoveLanguage,
            preferredLifestyle: profileData.preferredLifestyle,
            preferredValues: profileData.preferredValues,
            preferredMindset: profileData.preferredMindset,
            preferredPersonality: profileData.preferredPersonality
          }
        }
      });

      if (profileError) {
        console.error('Profile completion error:', profileError);
        throw new Error('Failed to complete profile setup');
      }

      console.log('Profile completion successful:', profileResult);
      toast({ title: "Profile Setup Complete! 🎉", description: `Your QCS score: ${totalScore}/100. Ready to start!` });

      console.log('🔧 Setting default free subscription tier...');
      // Set default free subscription tier in database before completing
      const { error: subscriptionError } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('user_id', userId);

      if (subscriptionError) {
        console.error('❌ Error setting default subscription:', subscriptionError);
      } else {
        console.log('✅ Default subscription tier set to free');
      }

      console.log('🎯 Calling onComplete to trigger redirect...');
      // Now complete and trigger redirect to main app
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
       case 5: // ID Verification - only proceed after verified
        return verificationStatus === 'verified';
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
              onVerificationStatusChange={(s) => setVerificationStatus(s)}
            />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-premium genZ-glass-card genZ-hover-lift">
          <CardHeader className="text-center space-y-6 sm:space-y-8 pb-6 sm:pb-10 px-4 sm:px-8">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 bg-black/20 hover:bg-primary/20 text-white transition-luxury hover-luxury border border-white/20"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              
              <div className="text-xs sm:text-sm text-white/80 font-modern font-semibold bg-black/20 px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-white/20">
                Step {currentStep} of {totalSteps} ✨
              </div>
              
              <div className="w-12 sm:w-14" /> {/* Spacer */}
            </div>

            <ProgressIndicator 
              currentStep={currentStep} 
              totalSteps={totalSteps}
              stepTitles={stepTitles}
            />
            
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <CardTitle className="text-2xl sm:text-4xl font-elegant font-bold text-gradient-royal animate-fade-in">
                  {stepTitles[currentStep - 1]}
                </CardTitle>
                <div className="absolute -top-1 -right-2 sm:-top-2 sm:-right-4 text-xl sm:text-2xl animate-bounce-slow">
                  {currentStep === 1 ? '👤' : currentStep === 2 ? '✨' : currentStep === 3 ? '💕' : currentStep === 4 ? '📸' : '🔐'}
                </div>
              </div>
              <p className="text-white/80 font-modern text-base sm:text-lg">
                Create your perfect GenZ profile 🚀
              </p>
              <div className="flex justify-center space-x-2 text-base sm:text-lg animate-pulse-glow delay-500">
                <span>💫</span>
                <span>🌟</span>
                <span>💜</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-10 pb-8 sm:pb-12 space-y-8 sm:space-y-10">
            <div className="animate-elegant-entrance genZ-glass-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pt-4 sm:pt-6">
              <Button
                onClick={handleBack}
                variant="outline"
                className="w-full sm:flex-1 h-14 sm:h-16 rounded-2xl font-modern font-bold transition-luxury hover-luxury border-2 border-white/20 bg-black/20 text-white hover:bg-white/10 text-base sm:text-lg"
                disabled={isLoading}
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="w-full sm:flex-1 h-14 sm:h-16 rounded-2xl bg-gradient-primary hover:shadow-royal transition-luxury font-modern font-bold text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white/30 border-t-white"></div>
                    <span className="text-base sm:text-lg">Creating Magic...</span>
                    <span>✨</span>
                  </div>
                ) : currentStep === totalSteps ? (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-lg">Complete Profile</span>
                    <span>🎉</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-base sm:text-lg">Continue</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>🚀</span>
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