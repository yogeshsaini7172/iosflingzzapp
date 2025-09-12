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

  // Only check profile on mount or login
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) {
        setCurrentStep('auth');
        return;
      }
      try {
        const userId = user.uid;
        if (!userId) {
          setCurrentStep('profile');
          setHasProfile(false);
          return;
        }
        const { fetchWithFirebaseAuth } = await import('@/lib/fetchWithFirebaseAuth');
        const checkResponse = await fetchWithFirebaseAuth('/functions/v1/data-management', {
          method: 'POST',
          body: JSON.stringify({ action: 'get_profile' })
        });
        if (checkResponse.ok) {
          const result = await checkResponse.json();
          const profile = result?.data?.profile;
          const isComplete = profile && profile.first_name && profile.last_name && profile.bio && profile.gender;
          if (isComplete) {
            // If profile is complete, redirect to home (prevents popup)
            window.location.replace('/');
            return;
          }
        }
        setCurrentStep('profile');
        setHasProfile(false);
      } catch (error) {
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