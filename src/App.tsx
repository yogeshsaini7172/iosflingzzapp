import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import SwipePage from "./pages/SwipePage";
import PairingPage from "./pages/PairingPage";
import MatchesPage from "./pages/MatchesPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import BlindDatePage from "./pages/BlindDatePage";
import FeedPage from "./pages/FeedPage";
import AuthPage from "./pages/AuthPage";
import DateSigmaHome from "./components/campus/DateSigmaHome";
import SubscriptionPage from "./components/subscription/SubscriptionPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { supabase } from "@/integrations/supabase/client";

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
  const navigate = useNavigate();
  console.log('👤 Current user state:', { user: user?.uid, isLoading });
  
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Function to check if user has completed profile
  const checkUserProfile = async (userId: string) => {
    try {
      // Check localStorage flag first (faster)
      const flag = localStorage.getItem('profile_complete');
      if (flag === 'true') return true;
      
      // Check demo profile as fallback
      const demoProfile = localStorage.getItem('demoProfile');
      if (demoProfile) return true;
      
      // As last resort, check if user has profile in database
      // This ensures profile completion persists across devices/browsers
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
          
        if (data && !error) {
          // User has profile in database, set localStorage for future
          localStorage.setItem('profile_complete', 'true');
          return true;
        }
      } catch (dbError) {
        console.log('Database check failed, using localStorage only');
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking profile:', error);
      return false;
    }
  };

  // Function to recheck profile status
  const recheckProfile = async () => {
    if (!user) return false;
    const profileComplete = await checkUserProfile(user.uid);
    setHasProfile(!!profileComplete);
    return !!profileComplete;
  };

  useEffect(() => {
    console.log('🔄 App starting, checking auth state...');
    const clearDemoLocalStorage = () => {
      try {
        // Clear only demo/testing caches, but preserve profile_complete
        const keys = [
          'demoProfile',
          'demoPreferences', 
          'demoUserId',
          'demoQCS',
          'subscription_plan'
          // DO NOT clear 'profile_complete' - this tracks real profile completion
        ];
        keys.forEach((k) => localStorage.removeItem(k));
        console.log('🧹 Cleared demo localStorage keys (preserving profile_complete)');
      } catch (e) {
        console.warn('⚠️ Failed clearing demo localStorage keys', e);
      }
    };

    const checkProfile = async () => {
      console.log('📋 Checking profile for user:', user?.uid);
      if (user) {
        // Clear demo caches but preserve real profile completion status
        clearDemoLocalStorage();
        try {
          const profileComplete = await checkUserProfile(user.uid);
          console.log('✅ Profile check result:', { profileComplete });
          setHasProfile(!!profileComplete);
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

  // Show authentication/profile setup flow if not complete
  if (!hasProfile) {
    console.log('🔑 Showing auth/setup flow...', { 
      hasUser: !!user, 
      hasProfile
    });
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <Toaster />
          <Sonner />
          <div id="recaptcha-container"></div>
          <Index 
            onProfileComplete={recheckProfile}
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
            // SPA navigation (no full reloads)
            if (view === 'home') navigate('/');
            if (view === 'pairing') navigate('/pairing');
            if (view === 'blind-date') navigate('/blind-date');
            if (view === 'profile') navigate('/profile');
            if (view === 'subscription') navigate('/subscription');
            if (view === 'chat') navigate('/chat');
            if (view === 'feed') navigate('/feed');
          }} />} />
          <Route path="/swipe" element={<SwipePage onNavigate={(view) => {}} />} />
          <Route path="/feed" element={<FeedPage onNavigate={(view) => {
            if (view === 'home') navigate('/');
            if (view === 'pairing') navigate('/pairing');
            if (view === 'profile') navigate('/profile');
          }} />} />
          <Route path="/pairing" element={<PairingPage onNavigate={(view) => {
            if (view === 'home') navigate('/');
            if (view === 'pairing') navigate('/pairing');
            if (view === 'blind-date') navigate('/blind-date');
            if (view === 'profile') navigate('/profile');
            if (view === 'subscription') navigate('/subscription');
          }} />} />
          <Route path="/matches" element={<MatchesPage onNavigate={(view) => {}} />} />
          <Route path="/chat/:matchId?" element={<ChatPage onNavigate={(view) => {
            if (view === 'home') navigate('/');
          }} />} />
          <Route path="/profile" element={<ProfilePage onNavigate={(view) => {
            if (view === 'home') navigate('/');
            if (view === 'pairing') navigate('/pairing');
            if (view === 'blind-date') navigate('/blind-date');
            if (view === 'profile') navigate('/profile');
            if (view === 'subscription') navigate('/subscription');
          }} />} />
          <Route path="/blind-date" element={<BlindDatePage onNavigate={(view) => {
            if (view === 'home') navigate('/');
            if (view === 'pairing') navigate('/pairing');
            if (view === 'blind-date') navigate('/blind-date');
            if (view === 'profile') navigate('/profile');
            if (view === 'subscription') navigate('/subscription');
          }} />} />
          <Route path="/subscription" element={<SubscriptionPage onNavigate={(view) => {
            if (view === 'home') navigate('/');
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