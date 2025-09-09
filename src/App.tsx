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
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";

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
  const { user, isLoading, userId } = useAuth();
  const navigate = useNavigate();
  console.log('👤 Current user state:', { user: user?.uid, isLoading });
  
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Function to check if user has completed profile
  const checkUserProfile = async (userId: string) => {
    try {
      // Check if profile exists via Edge Function
      const res = await fetchWithFirebaseAuth('/functions/v1/profile-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get' }),
      });
      
      if (!res.ok) {
        console.error('❌ Profile check failed:', res.status);
        return false;
      }
      
      const json = await res.json();
      const profile = json?.data?.profile;

      if (profile && profile.user_id) {
        // Profile exists and has data - check if it's complete
        const hasBasicInfo = profile.first_name && profile.last_name && profile.bio;
        return hasBasicInfo;
      }

      // No profile exists - this should trigger profile setup flow
      return false;
    } catch (error) {
      console.error('❌ Error checking profile:', error);
      return false;
    }
  };

  // Function to recheck profile status
  const recheckProfile = async () => {
    console.log('🔄 Rechecking profile status...');
    
    // Always prioritize local completion flags for development
    const localFlag = localStorage.getItem('profile_complete') === 'true';
    const demo = localStorage.getItem('demoProfile');
    
    if (localFlag || demo) {
      console.log('✅ Found local profile completion, proceeding to app');
      setHasProfile(true);
      return true;
    }
    
    // Only try server check if we have userId and no local flags
    if (userId) {
      try {
        const profileComplete = await checkUserProfile(userId);
        if (profileComplete) {
          console.log('✅ Server confirmed profile complete');
          setHasProfile(true);
          return true;
        }
      } catch (error) {
        console.warn('⚠️ Server profile check failed, falling back to local check');
      }
    }
    
    console.log('❌ No valid profile found');
    setHasProfile(false);
    return false;
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
      console.log('📋 Checking profile for user:', userId);
      if (userId) {
        // Clear demo caches but preserve real profile completion status
        clearDemoLocalStorage();
        try {
          const profileComplete = await checkUserProfile(userId);
          console.log('✅ Profile check result:', { profileComplete });
          if (!profileComplete) {
            const localFlag = localStorage.getItem('profile_complete') === 'true';
            const demo = localStorage.getItem('demoProfile');
            if (localFlag || demo) {
              console.log('⚠️ Using local profile_complete fallback (demo/local)');
              setHasProfile(true);
            } else {
              setHasProfile(false);
            }
          } else {
            setHasProfile(true);
          }
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
          <Route path="/matches" element={<MatchesPage onNavigate={(view) => {
            if (view === 'home') navigate('/');
            if (view === 'chat') navigate('/chat');
          }} />} />
          <Route path="/chat" element={<ChatPage onNavigate={(view) => {
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