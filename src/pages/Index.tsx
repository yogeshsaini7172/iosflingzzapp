import DatingApp from "@/components/DatingApp";
import SplashScreen from "@/components/onboarding/SplashScreen";
import ProfileSetupFlow from "@/components/profile/ProfileSetupFlow";
import { useState } from "react";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'splash' | 'profile' | 'app'>('splash');

  // Handle different steps
  switch (currentStep) {
    case 'splash':
      return (
        <SplashScreen 
          onContinue={() => setCurrentStep('profile')} 
        />
      );

    case 'profile':
      return (
        <ProfileSetupFlow 
          onComplete={() => setCurrentStep('app')}
        />
      );

    case 'app':
    default:
      return <DatingApp />;
  }
};

export default Index;