import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/useImageUpload";
import BasicDetailsStep from "./steps/BasicDetailsStep";
import WhatYouAreStep from "./steps/WhatYouAreStep";
import WhoYouWantStep from "./steps/WhoYouWantStep";
import UploadPhotosStep from "./steps/UploadPhotosStep";
import IDVerificationStep from "./steps/IDVerificationStep";
import ProgressIndicator from "./steps/ProgressIndicator";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateAge, validateMinimumAge, MINIMUM_AGE } from "@/utils/ageValidation";

interface ProfileSetupFlowProps {
  onComplete: () => void;
}

const ProfileSetupFlow = ({ onComplete }: ProfileSetupFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'verified' | 'failed'>('idle');
  const { toast } = useToast();
  const { user, userId } = useAuth();
  const { uploadMultipleImages, uploading } = useImageUpload();

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
    preferredRelationshipGoals: [] as string[],
    preferredLoveLanguage: [] as string[],
    preferredLifestyle: [] as string[],
    
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
      
      // Require authenticated session
      if (!user) {
        toast({ title: "Please sign in first", description: "Login before completing your profile.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      // Use Firebase UID consistently
      if (!userId) {
        toast({ title: "Authentication error", description: "User ID not available", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Final age validation before profile creation
      if (!validateMinimumAge(profileData.dateOfBirth)) {
        const age = calculateAge(profileData.dateOfBirth);
        toast({ 
          title: "Age requirement not met", 
          description: `You must be at least ${MINIMUM_AGE} years old. You are currently ${age} years old.`, 
          variant: "destructive" 
        });
        setCurrentStep(1); // Go back to basic details step
        setIsLoading(false);
        return;
      }
      
      // Upload profile images to Supabase Storage first
      let imageUrls: string[] = [];
      if (profileData.profileImages && profileData.profileImages.length > 0) {
        toast({ title: "Uploading photo... 📸", description: "Please wait while we save your main image" });
        // Only allow one image (main photo) for initial profile creation
  const mainImageFile = profileData.profileImages[0];
  const uploadedImages = await uploadMultipleImages([mainImageFile], 'profile-images');
  // Save the public URL, not just the path
  imageUrls = uploadedImages.map(img => img.url);
  console.log('Uploaded main image public URLs:', imageUrls);
      }

      // Store complete profile data with proper field mapping
      const completeProfile = {
        user_id: userId,
        // Basic info
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: user?.email || `${userId}@firebase.user`,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender,
        university: profileData.university,
        major: profileData.fieldOfStudy, // Map to major field
        year_of_study: profileData.yearOfStudy ? Number(profileData.yearOfStudy) : null,
        field_of_study: profileData.fieldOfStudy,
        
        // What you are - proper field mapping
        height: profileData.height ? Number(profileData.height) : null,
        body_type: profileData.bodyType,
        skin_tone: profileData.skinTone,
        face_type: profileData.faceType,
        personality_type: profileData.personalityType,
        personality_traits: profileData.personalityType ? [profileData.personalityType] : [],
        values: profileData.values,
        values_array: profileData.values ? [profileData.values] : [],
        mindset: profileData.mindset,
        love_language: profileData.loveLanguage,
        lifestyle: profileData.lifestyle,
        relationship_goals: profileData.relationshipGoals,
        interests: profileData.interests,
        bio: profileData.bio,
        
        // Images and settings
        profile_images: imageUrls,
        display_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        avatar_url: imageUrls.length > 0 ? imageUrls[0] : null,
        is_profile_public: profileData.isProfilePublic,
        verification_status: 'pending',
        college_tier: 'tier3',
        subscription_tier: 'free',
        swipes_left: 20,
        show_profile: true,
        is_active: true,
        total_qcs: 0  // Initialize with 0, will be updated after QCS calculation
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
        preferred_skin_tone: profileData.preferredSkinTone || [],
        preferred_skin_types: profileData.preferredSkinTone || [], // For backward compatibility
        preferred_face_type: profileData.preferredFaceType,
        preferred_values: profileData.preferredValues,
        preferred_mindset: profileData.preferredMindset,
        preferred_personality_traits: profileData.preferredPersonality,
        preferred_relationship_goals: profileData.preferredRelationshipGoals,
        preferred_love_languages: profileData.preferredLoveLanguage || [],
        preferred_lifestyle: profileData.preferredLifestyle || []
      };

      // Remove demo localStorage - everything is real now
      console.log('Creating real profile, no demo storage needed');

      // Check if verification was completed (either verified status or documents uploaded)
      const hasVerificationDocuments = profileData.collegeIdFile || profileData.govtIdFile;
      const isVerificationComplete = verificationStatus === 'verified' || hasVerificationDocuments;
      
      if (!isVerificationComplete) {
        toast({
          title: "Verification required",
          description: "Please submit your IDs and verify before completing.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Set verification status - use actual status or 'pending' if documents uploaded
      completeProfile.verification_status = verificationStatus === 'verified' ? 'verified' : 'pending';

      // Calculate QCS after profile creation (server-side)
      console.log('🔄 Profile will be created and QCS calculated server-side...');
      
      // Update the completeProfile - QCS will be calculated after profile creation
      completeProfile.total_qcs = 0; // Will be updated by server

      // Log the complete profile data before sending
      console.log('Complete profile data:', JSON.stringify(completeProfile, null, 2));

      // Create profile via profile-completion function (Supabase client handles CORS/auth)
      const { data: profileResult, error: profileError } = await supabase.functions.invoke('profile-completion', {
        body: {
          userId: completeProfile.user_id,
          firstName: completeProfile.first_name,
          lastName: completeProfile.last_name,
          dateOfBirth: completeProfile.date_of_birth,
          gender: completeProfile.gender,
          university: completeProfile.university,
          fieldOfStudy: completeProfile.field_of_study,
          height: completeProfile.height,
          bodyType: completeProfile.body_type,
          skinTone: completeProfile.skin_tone,
          faceType: completeProfile.face_type,
          personalityType: completeProfile.personality_type,
          values: completeProfile.values,
          mindset: completeProfile.mindset,
          relationshipGoals: completeProfile.relationship_goals || [],
          interests: completeProfile.interests || [],
          bio: completeProfile.bio,
          profileImages: completeProfile.profile_images || [],
          isProfilePublic: completeProfile.is_profile_public,
          qcsScore: 0, // Will be calculated server-side
          preferences: {
            preferredGender: preferences.preferred_gender || [],
            ageRangeMin: preferences.age_range_min || 18,
            ageRangeMax: preferences.age_range_max || 30,
            heightRangeMin: preferences.height_range_min || 150,
            heightRangeMax: preferences.height_range_max || 200,
            preferredBodyTypes: preferences.preferred_body_types || [],
            preferredSkinTone: preferences.preferred_skin_tone || [],
            preferredFaceType: preferences.preferred_face_type || [],
            preferredValues: preferences.preferred_values || [],
            preferredMindset: preferences.preferred_mindset || [],
            preferredPersonality: preferences.preferred_personality_traits || [],
            preferredRelationshipGoals: preferences.preferred_relationship_goals || [],
            preferredLoveLanguage: preferences.preferred_love_languages || [],
            preferredLifestyle: preferences.preferred_lifestyle || [],
            loveLanguage: completeProfile.love_language,
            lifestyle: completeProfile.lifestyle
          },
          email: completeProfile.email
        }
      });

      if (profileError) {
        console.error('Failed to save profile (invoke):', profileError);
        throw new Error(profileError.message || 'Failed to save profile');
      }

      console.log('Profile saved successfully:', profileResult);

      // Always create preferences - use defaults for empty values and ensure correct types
      const preferencesPayload = {
        preferred_gender: Array.isArray(profileData.preferredGender) ? profileData.preferredGender : [],
        age_range_min: Number(profileData.ageRangeMin) || 18,
        age_range_max: Number(profileData.ageRangeMax) || 30,
        preferred_relationship_goals: Array.isArray(profileData.preferredRelationshipGoals) ? profileData.preferredRelationshipGoals : [],
        height_range_min: Number(profileData.heightRangeMin) || 150,
        height_range_max: Number(profileData.heightRangeMax) || 200,
        preferred_body_types: Array.isArray(profileData.preferredBodyTypes) ? profileData.preferredBodyTypes : [],
        preferred_skin_tone: Array.isArray(profileData.preferredSkinTone) ? profileData.preferredSkinTone : [],
        preferred_face_type: Array.isArray(profileData.preferredFaceType) ? profileData.preferredFaceType : [],
        preferred_values: Array.isArray(profileData.preferredValues) ? profileData.preferredValues : [],
        preferred_mindset: Array.isArray(profileData.preferredMindset) ? profileData.preferredMindset : [],
        preferred_personality_traits: Array.isArray(profileData.preferredPersonality) ? profileData.preferredPersonality : [],
        preferred_love_languages: Array.isArray(profileData.preferredLoveLanguage) ? profileData.preferredLoveLanguage : [],
        preferred_lifestyle: Array.isArray(profileData.preferredLifestyle) ? profileData.preferredLifestyle : []
      };

      console.log('🔄 Sending preferences payload:', JSON.stringify(preferencesPayload, null, 2));

      const preferencesResponse = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/data-management',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'update_preferences',
            preferences: preferencesPayload
          })
        }
      );
      

      if (!preferencesResponse.ok) {
        const errorData = await preferencesResponse.json().catch(() => ({}));
        console.error('❌ Preferences creation failed:', {
          status: preferencesResponse.status,
          statusText: preferencesResponse.statusText,
          error: errorData,
          errorDetails: errorData.details,
          errorMessage: errorData.error
        });
        
        // Show the actual error to help debug
        toast({
          title: "Preferences Error (Debug)",
          description: `${errorData.error || 'Unknown error'} - Status: ${preferencesResponse.status}`,
          variant: "destructive"
        });
        
        console.warn('Preferences creation failed, but profile was created successfully');
      } else {
        const successData = await preferencesResponse.json();
        console.log('✅ Preferences created successfully:', successData);
        
        // Store preferences in localStorage for quick access
        if (successData.data?.preferences) {
          localStorage.setItem('user_preferences', JSON.stringify(successData.data.preferences));
          console.log('💾 Preferences stored in localStorage');
        }
      }
      toast({ 
        title: "Profile Setup Complete! 🎉", 
        description: "Account created! Calculating your QCS score..." 
      });

      // Save profile data to local storage for quick access
      localStorage.setItem('user_profile', JSON.stringify({
        ...completeProfile,
        profile_complete: true
      }));

      // Mark profile as complete locally and go to app
      localStorage.setItem('profile_complete', 'true');
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
        const isAgeValid = validateMinimumAge(profileData.dateOfBirth);
        return profileData.firstName && profileData.lastName && profileData.dateOfBirth && 
               profileData.gender && isAgeValid;
      case 2: // What You Are
        return profileData.personalityType && profileData.values && profileData.bio;
      case 3: // Who You Want
        return profileData.preferredGender.length > 0 && profileData.preferredRelationshipGoals.length > 0;
      case 4: // Upload Photos
        return profileData.profileImages.length >= 1;
      case 5: // ID Verification - only proceed after verified
        return verificationStatus === 'verified' || profileData.collegeIdFile || profileData.govtIdFile;
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
            onChange={(updater) => setProfileData(prev => ({ ...prev, ...updater(prev) }))}
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