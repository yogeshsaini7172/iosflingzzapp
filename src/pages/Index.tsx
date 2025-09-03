import DatingApp from "@/components/DatingApp";
import SplashScreen from "@/components/onboarding/SplashScreen";
import EnhancedProfileCreation from "@/components/dating/EnhancedProfileCreation";
import SubscriptionSelector from "@/components/onboarding/SubscriptionSelector";
import IDVerificationFlow from "@/components/verification/IDVerificationFlow";
import { useState } from "react";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'splash' | 'profile' | 'subscription' | 'verification' | 'app'>('splash');

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
        <EnhancedProfileCreation 
          onBack={() => setCurrentStep('splash')}
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