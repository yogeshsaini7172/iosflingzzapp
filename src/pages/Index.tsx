import AuthPage from "@/pages/AuthPage";
import SplashScreen from "@/components/onboarding/SplashScreen";
import ProfileSetupFlow from "@/components/profile/ProfileSetupFlow";
import DemoModeButton from "@/components/demo/DemoModeButton";

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

      // Check profile via local flag to avoid cross-auth mismatch
      const flag = localStorage.getItem('profile_complete') === 'true';
      const demo = localStorage.getItem('demoProfile');

      if (!flag && !demo) {
        setCurrentStep('profile');
        setHasProfile(false);
      } else {
        setHasProfile(true);
      }
    };

    if (!isLoading) {
      checkUserProfile();
    }
  }, [user, isLoading]);

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
      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 items-center min-h-screen">
              <div>
                <AuthPage onComplete={() => setCurrentStep('profile')} />
              </div>
              <div className="hidden md:block">
                <DemoModeButton 
                  onActivate={async () => {
                    if (onProfileComplete) {
                      await onProfileComplete();
                    }
                  }} 
                />
              </div>
            </div>
            
            {/* Mobile demo button */}
            <div className="md:hidden mt-8">
              <DemoModeButton 
                onActivate={async () => {
                  if (onProfileComplete) {
                    await onProfileComplete();
                  }
                }} 
              />
            </div>
          </div>
        </div>
      );

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
            
            // Trigger parent recheck and wait for it
            if (onProfileComplete) {
              const profileCompleted = await onProfileComplete();
              console.log('Parent recheck completed:', profileCompleted);
            }
          }}
        />
      );

      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
            <DemoModeButton 
              onActivate={async () => {
                if (onProfileComplete) {
                  await onProfileComplete();
                }
              }} 
            />
          </div>
        );
  }
};

export default Index;