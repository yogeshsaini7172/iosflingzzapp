import DatingApp from "@/components/DatingApp";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import SplashScreen from "@/components/onboarding/SplashScreen";
import LoginOptions from "@/components/onboarding/LoginOptions";
import EnhancedProfileCreation from "@/components/dating/EnhancedProfileCreation";
import SubscriptionSelector from "@/components/onboarding/SubscriptionSelector";
import IDVerificationFlow from "@/components/verification/IDVerificationFlow";
import { useEffect, useState } from "react";

const Index = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfileData();
  const [currentStep, setCurrentStep] = useState<'splash' | 'auth' | 'profile' | 'subscription' | 'verification' | 'app'>('splash');

  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      setCurrentStep('splash');
      return;
    }

    // User is authenticated, check profile completion
    if (!profile) {
      setCurrentStep('profile');
      return;
    }

    // Check if subscription is set
    if (!profile.subscription_tier || profile.subscription_tier === 'free') {
      // If they haven't explicitly chosen a plan, show subscription selector
      if (profile.swipes_left === undefined || profile.swipes_left === null) {
        setCurrentStep('subscription');
        return;
      }
    }

    // Check verification status
    if (profile.verification_status === 'pending') {
      setCurrentStep('verification');
      return;
    }

    // Everything is complete, show main app
    setCurrentStep('app');
  }, [user, profile, authLoading, profileLoading]);

  // Show loading while checking auth/profile status
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    );
  }

  // Handle different steps
  switch (currentStep) {
    case 'splash':
      return (
        <SplashScreen 
          onContinue={() => setCurrentStep('auth')} 
        />
      );

    case 'auth':
      return (
        <LoginOptions 
          onBack={() => setCurrentStep('splash')}
          onContinue={() => setCurrentStep('profile')}
        />
      );

    case 'profile':
      return (
        <EnhancedProfileCreation 
          onBack={() => setCurrentStep('auth')}
          onComplete={() => setCurrentStep('subscription')}
        />
      );

    case 'subscription':
      return (
        <SubscriptionSelector 
          onBack={() => setCurrentStep('profile')}
          onComplete={() => setCurrentStep('verification')}
        />
      );

    case 'verification':
      return (
        <IDVerificationFlow 
          onBack={() => setCurrentStep('subscription')}
          onComplete={() => setCurrentStep('app')}
        />
      );

    case 'app':
    default:
      return <DatingApp />;
  }
};

export default Index;