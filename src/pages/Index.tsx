import { useEffect, useState } from "react";
import AuthScreen from "@/components/auth/AuthScreen";
import CampusConnectHome from "@/components/campus/CampusConnectHome";
import SplashScreen from "@/components/onboarding/SplashScreen";
import EnhancedProfileCreation from "@/components/dating/EnhancedProfileCreation";
import ModernSwipeCards from "@/components/dating/ModernSwipeCards";
import BlindDateSetup from "@/components/dating/BlindDateSetup";
import MatchesList from "@/components/dating/MatchesList";
import ModernChatScreen from "@/components/chat/ModernChatScreen";
import ExploreScreen from "@/components/explore/ExploreScreen";
import IDVerificationFlow from "@/components/verification/IDVerificationFlow";
import DetailedProfileCreation from "@/components/profile/DetailedProfileCreation";
import EnhancedSwipeCards from "@/components/matching/EnhancedSwipeCards";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [currentView, setCurrentView] = useState<'splash' | 'auth' | 'home' | 'profile' | 'discover' | 'blind-date' | 'matches' | 'chat' | 'explore' | 'verify' | 'detailed-profile' | 'enhanced-swipe' | 'subscription' | 'admin'>('splash');
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'starter' | 'plus' | 'pro'>('free');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        setIsAuthenticated(true);
        setCurrentView('detailed-profile');
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setCurrentView('detailed-profile');
      } else {
        setIsAuthenticated(false);
        setCurrentView('auth');
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleNavigate = (view: string) => {
    setCurrentView(view as any);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'splash':
        return <SplashScreen onContinue={() => setCurrentView('auth')} />;
      case 'auth':
        return <AuthScreen onBack={() => setCurrentView('splash')} onComplete={() => { /* handled by auth state listener once session exists */ }} />;
      case 'home':
        return <CampusConnectHome onNavigate={handleNavigate} />;
      case 'profile':
        return <EnhancedProfileCreation onComplete={() => setCurrentView('home')} onBack={() => setCurrentView('home')} />;
      case 'discover':
        return <ModernSwipeCards onNavigate={handleNavigate} />;
      case 'blind-date':
        return <BlindDateSetup onNavigate={handleNavigate} />;
      case 'matches':
        return <MatchesList onNavigate={handleNavigate} />;
      case 'chat':
        return <ModernChatScreen onNavigate={handleNavigate} />;
      case 'explore':
        return <ExploreScreen onNavigate={handleNavigate} />;
      case 'verify':
        return <IDVerificationFlow onComplete={() => setCurrentView('home')} onBack={() => setCurrentView('detailed-profile')} />;
      case 'detailed-profile':
        return <DetailedProfileCreation onComplete={() => setCurrentView('verify')} onBack={() => setCurrentView('auth')} />;
      case 'enhanced-swipe':
        return <EnhancedSwipeCards onNavigate={handleNavigate} subscriptionTier={subscriptionTier} />;
      case 'subscription':
        return <SubscriptionPlans onSubscribe={(tier) => { setSubscriptionTier(tier as any); setCurrentView('home'); }} currentTier={subscriptionTier} />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <CampusConnectHome onNavigate={handleNavigate} />;
    }
  };

  return renderCurrentView();
};

export default Index;