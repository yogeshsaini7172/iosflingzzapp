import AuthPage from "@/pages/AuthPage";
import SplashScreen from "@/components/onboarding/SplashScreen";
import ProfileSetupFlow from "@/components/profile/ProfileSetupFlow";
import SubscriptionSelectionPage from '@/components/subscription/SubscriptionSelectionPage';
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface IndexProps {
  onProfileComplete?: () => Promise<boolean>;
  showSubscription?: boolean;
}

const Index = ({ onProfileComplete, showSubscription }: IndexProps) => {
  const [currentStep, setCurrentStep] = useState<'auth' | 'splash' | 'profile' | 'subscription'>('auth');
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
        // Check if we should show subscription selection
        if (showSubscription) {
          setCurrentStep('subscription');
        }
      }
    };

    if (!isLoading) {
      checkUserProfile();
    }
  }, [user, isLoading, showSubscription]);

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
            console.log('🎯 Profile setup complete, triggering recheck...');
            setHasProfile(true);
            
            // Trigger parent recheck and wait for it
            if (onProfileComplete) {
              console.log('⏳ Calling onProfileComplete...');
              const profileCompleted = await onProfileComplete();
              console.log('✅ Parent recheck completed:', profileCompleted);
              
              // Force a small delay to ensure state updates propagate
              setTimeout(() => {
                console.log('🔄 Profile setup flow completed, app should redirect now');
              }, 100);
            }
          }}
        />
      );

      case 'subscription':
        return (
          <SubscriptionSelectionPage 
            onComplete={async (tier: string) => {
              console.log(`✅ Subscription tier selected: ${tier}`);
              
              // Update user's subscription tier in database
              const { error } = await supabase
                .from('profiles')
                .update({ subscription_tier: tier })
                .eq('user_id', user?.uid);

              if (error) {
                console.error('❌ Error updating subscription tier:', error);
              }
              
              // Call the callback to recheck status and proceed to app
              if (onProfileComplete) {
                await onProfileComplete();
              }
            }}
          />
        );

      default:
      return <AuthPage onComplete={() => setCurrentStep('profile')} />;
  }
};

export default Index;