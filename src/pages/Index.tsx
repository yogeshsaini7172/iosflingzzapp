import AuthPage from "@/pages/AuthPage";
import SplashScreen from "@/components/onboarding/SplashScreen";
import ProfileSetupFlow from "@/components/profile/ProfileSetupFlow";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";


interface IndexProps {
  onProfileComplete?: () => Promise<boolean>;
}

const Index = ({ onProfileComplete }: IndexProps) => {
  const [currentStep, setCurrentStep] = useState<'auth' | 'splash' | 'profile'>('auth');
  const [hasProfile, setHasProfile] = useState(false);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) {
        setCurrentStep('auth');
        return;
      }

      // Check if user already has a complete profile
      try {
        const userId = user.uid;
        if (!userId) {
          setCurrentStep('profile');
          setHasProfile(false);
          return;
        }

        // Check if profile exists via data-management function using fetchWithFirebaseAuth
        const { fetchWithFirebaseAuth } = await import('@/lib/fetchWithFirebaseAuth');
        
        const checkResponse = await fetchWithFirebaseAuth('/functions/v1/data-management', {
          method: 'POST',
          body: JSON.stringify({ action: 'get_profile' })
        });

        if (checkResponse.ok) {
          const result = await checkResponse.json();
          const profile = result?.data?.profile;
          
          // Check if profile is complete (has basic required fields)
          const isComplete = profile && 
            profile.first_name && 
            profile.last_name && 
            profile.bio && 
            profile.gender;

          if (isComplete) {
            console.log('User has complete profile, redirecting to main app...');
            setHasProfile(true);
            // Trigger parent to recheck - this will show main app
            if (onProfileComplete) {
              await onProfileComplete();
            }
            return;
          }
        }
        
        // No complete profile found - show profile setup
        console.log('User needs profile setup');
        setCurrentStep('profile');
        setHasProfile(false);
      } catch (error) {
        console.error('Error checking profile:', error);
        // Default to profile setup on error
        setCurrentStep('profile');
        setHasProfile(false);
      }
    };

    if (!isLoading) {
      checkUserProfile();
    }
  }, [user, isLoading, onProfileComplete]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  // This component now only handles unauthenticated users and profile setup
  // App.tsx will handle routing for authenticated users with complete profiles

  // Handle different steps
  switch (currentStep) {
    case 'auth':
      return <AuthPage onComplete={() => setCurrentStep('profile')} />;

    case 'splash':
      return (
        <SplashScreen 
          onContinue={() => setCurrentStep('profile')} 
        />
      );

    case 'profile':
      return (
        <ProfileSetupFlow 
          onComplete={async () => {
            console.log('Profile setup complete, triggering recheck...');
            setHasProfile(true);
            
            // Mark profile as complete in localStorage for App.tsx check
            localStorage.setItem('profile_complete', 'true');
            
            // Trigger parent recheck and wait for it
            if (onProfileComplete) {
              const profileCompleted = await onProfileComplete();
              console.log('Parent recheck completed:', profileCompleted);
            }
          }}
        />
      );

      default:
        return <AuthPage onComplete={() => setCurrentStep('profile')} />;
  }
};

export default Index;