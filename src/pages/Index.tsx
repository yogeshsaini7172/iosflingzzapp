import AuthPage from "@/pages/AuthPage";
import SplashScreen from "@/components/onboarding/SplashScreen";
import ProfileSetupFlow from "@/components/profile/ProfileSetupFlow";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface IndexProps {
  onProfileComplete?: () => void;
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

      // Check if user has completed profile setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.uid)
        .maybeSingle();

      if (!profile || !profile.first_name || !profile.university) {
        setCurrentStep('profile');
        setHasProfile(false);
      } else {
        setHasProfile(true);
        // User has completed profile, let App.tsx handle the routing
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
      return <AuthPage />;

    case 'splash':
      return (
        <SplashScreen 
          onContinue={() => setCurrentStep('profile')} 
        />
      );

    case 'profile':
      return (
        <ProfileSetupFlow 
          onComplete={() => {
            setHasProfile(true);
            onProfileComplete?.(); // Trigger recheck in App.tsx
          }}
        />
      );

    default:
      return <AuthPage />;
  }
};

export default Index;