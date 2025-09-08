import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SwipePage from "./pages/SwipePage";
import PairingPage from "./pages/PairingPage";
import MatchesPage from "./pages/MatchesPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import BlindDatePage from "./pages/BlindDatePage";
import FeedPage from "./pages/FeedPage";
import DateSigmaHome from "./components/campus/DateSigmaHome";
import SubscriptionPage from "./components/subscription/SubscriptionPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import GenZBackground from "./components/ui/genZ-background";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const AuthenticatedApp = () => {
  console.log('🔒 AuthenticatedApp component rendering...');
  const { user, isLoading } = useAuth();
  console.log('👤 Current user state:', { user: user?.uid, isLoading });
  
  const [hasProfile, setHasProfile] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Function to check if user has completed profile
  const checkUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Checking profile for userId:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('📊 Profile query result:', { profile, error });
      
      if (error) {
        console.error('❌ Supabase profile query error:', error);
        return false;
      }

      const isComplete = profile && profile.first_name && profile.university;
      console.log('✅ Profile completeness:', isComplete);
      return isComplete;
    } catch (error) {
      console.error('❌ Error checking profile:', error);
      return false;
    }
  };

  // Function to check if user has selected a subscription
  const checkUserSubscription = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('user_id', userId)
        .maybeSingle();

      // Accept any subscription tier (including 'free') as valid
      return !!(profile && profile.subscription_tier);
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  };

  // Function to recheck profile status
  const recheckProfile = async () => {
    if (!user) return false;
    
    console.log('🔄 Rechecking profile status for user:', user.uid);
    const profileComplete = await checkUserProfile(user.uid);
    const subscriptionSelected = await checkUserSubscription(user.uid);
    
    console.log('✅ Recheck results:', { profileComplete, subscriptionSelected });
    
    setHasProfile(!!profileComplete);
    setHasSubscription(!!subscriptionSelected);
    
    const allComplete = !!profileComplete && !!subscriptionSelected;
    console.log('🏁 Profile setup fully complete:', allComplete);
    
    return allComplete;
  };

  useEffect(() => {
    console.log('🔄 App starting, checking auth state...');
    const checkProfile = async () => {
      console.log('📋 Checking profile for user:', user?.uid);
      if (user) {
        try {
          console.log('🔍 Querying Supabase for profile...');
          const profileComplete = await checkUserProfile(user.uid);
          const subscriptionSelected = await checkUserSubscription(user.uid);
          
          console.log('✅ Profile check results:', { profileComplete, subscriptionSelected });
          setHasProfile(!!profileComplete);
          setHasSubscription(!!subscriptionSelected);
        } catch (error) {
          console.error('❌ Error in profile check:', error);
        }
      }
      setCheckingProfile(false);
    };

    if (!isLoading) {
      checkProfile();
    }
  }, [user, isLoading]);

  if (isLoading || checkingProfile) {
    console.log('⏳ App loading...', { isLoading, checkingProfile });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading DateSigma...</p>
        </div>
      </div>
    );
  }

  // Show authentication/profile setup/subscription flow if not complete
  if (!user || !hasProfile || !hasSubscription) {
    console.log('🔑 Showing auth/setup flow...', { 
      hasUser: !!user, 
      hasProfile, 
      hasSubscription 
    });
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <Toaster />
          <Sonner />
          <div id="recaptcha-container"></div>
          <Index 
            onProfileComplete={recheckProfile}
            showSubscription={!!user && hasProfile && !hasSubscription}
          />
        </div>
      </TooltipProvider>
    );
  }

  console.log('✅ Showing main app...');
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Toaster />
        <Sonner />
        <div id="recaptcha-container"></div>
        <Routes>
          <Route path="/" element={<DateSigmaHome onNavigate={(view) => {
            // Handle navigation from home page
            if (view === 'home') window.location.href = '/';
            if (view === 'pairing') window.location.href = '/pairing';
            if (view === 'blind-date') window.location.href = '/blind-date';
            if (view === 'profile') window.location.href = '/profile';
            if (view === 'subscription') window.location.href = '/subscription';
            if (view === 'chat') window.location.href = '/chat';
            if (view === 'feed') window.location.href = '/feed';
          }} />} />
          <Route path="/swipe" element={<SwipePage onNavigate={(view) => {}} />} />
          <Route path="/feed" element={<FeedPage onNavigate={(view) => {
            if (view === 'home') window.location.href = '/';
            if (view === 'pairing') window.location.href = '/pairing';
            if (view === 'profile') window.location.href = '/profile';
          }} />} />
          <Route path="/pairing" element={<PairingPage onNavigate={(view) => {
            if (view === 'home') window.location.href = '/';
            if (view === 'pairing') window.location.href = '/pairing';
            if (view === 'blind-date') window.location.href = '/blind-date';
            if (view === 'profile') window.location.href = '/profile';
            if (view === 'subscription') window.location.href = '/subscription';
          }} />} />
          <Route path="/matches" element={<MatchesPage onNavigate={(view) => {}} />} />
          <Route path="/chat/:matchId?" element={<ChatPage onNavigate={(view) => {
            if (view === 'home') window.location.href = '/';
          }} />} />
          <Route path="/profile" element={<ProfilePage onNavigate={(view) => {
            if (view === 'home') window.location.href = '/';
            if (view === 'pairing') window.location.href = '/pairing';
            if (view === 'blind-date') window.location.href = '/blind-date';
            if (view === 'profile') window.location.href = '/profile';
            if (view === 'subscription') window.location.href = '/subscription';
          }} />} />
          <Route path="/blind-date" element={<BlindDatePage onNavigate={(view) => {
            if (view === 'home') window.location.href = '/';
            if (view === 'pairing') window.location.href = '/pairing';
            if (view === 'blind-date') window.location.href = '/blind-date';
            if (view === 'profile') window.location.href = '/profile';
            if (view === 'subscription') window.location.href = '/subscription';
          }} />} />
          <Route path="/subscription" element={<SubscriptionPage onNavigate={(view) => {
            if (view === 'home') window.location.href = '/';
          }} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </TooltipProvider>
  );
};

function App() {
  console.log('📱 App component rendering...');
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedApp />
    </QueryClientProvider>
  );
}

export { App };