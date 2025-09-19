import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SocketChatProvider } from "@/contexts/SocketChatContext";
import { ChatNotificationProvider } from "@/contexts/ChatNotificationContext";
import { useState, useEffect } from "react";
import SwipePage from "./pages/SwipePage";
import PairingPage from "./pages/PairingPage";
import MatchesPage from "./pages/MatchesPage";
import ProfilePage from "./pages/ProfilePage";
import BlindDatePage from "./pages/BlindDatePage";
import FeedPage from "./pages/FeedPage";
import FlingzzHome from "./components/campus/FlingzzHome";
import SubscriptionPage from "./components/subscription/SubscriptionPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import QCSTestPage from "./pages/QCSTestPage";
import QCSDiagnostics from "./components/QCSDiagnostics";
import QCSSystemRepair from "./components/QCSSystemRepair";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
import RebuiltChatSystem from "@/components/chat/RebuiltChatSystem";

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
  const { user, isLoading, userId, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  console.log('👤 Current user state:', { user: user?.uid, isLoading, isAuthenticated });

  useEffect(() => {
    if (user && (location.pathname === "/" || location.pathname === "/auth")) {
      navigate("/");
    }
  }, [user, navigate, location.pathname]);

  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Function to check if user has completed profile
  const checkUserProfile = async (userId: string) => {
    try {
      // Check if profile exists via Edge Function
      const res = await fetchWithFirebaseAuth('/functions/v1/data-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_profile' }),
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
    
    if (!userId) {
      console.log('❌ No user ID available');
      setHasProfile(false);
      return false;
    }
    
    try {
      const profileComplete = await checkUserProfile(userId);
      console.log('✅ Profile check result:', profileComplete);
      setHasProfile(!!profileComplete);
      return !!profileComplete;
    } catch (error) {
      console.error('❌ Error checking profile:', error);
      setHasProfile(false);
      return false;
    }
  };

  useEffect(() => {
    console.log('🔄 App starting, checking auth state...');
    const clearAllLocalStorage = () => {
      try {
        // Clear all localStorage items for fresh start
        const keys = [
          'demoProfile',
          'demoPreferences', 
          'demoUserId',
          'demoQCS',
          'subscription_plan',
          'profile_complete'
        ];
        keys.forEach((k) => localStorage.removeItem(k));
        console.log('🧹 Cleared all localStorage for real authentication');
      } catch (e) {
        console.warn('⚠️ Failed clearing localStorage keys', e);
      }
    };

    const checkProfile = async () => {
      console.log('📋 Checking profile for user:', userId);
      if (userId && isAuthenticated) {
        // Clear all local storage for real authentication
        clearAllLocalStorage();
        try {
          const profileComplete = await checkUserProfile(userId);
          console.log('✅ Profile check result:', { profileComplete });
          setHasProfile(!!profileComplete);
        } catch (error) {
          console.error('❌ Error in profile check:', error);
          setHasProfile(false);
        }
      } else {
        // User is not authenticated - reset profile state
        console.log('🚫 User not authenticated, resetting profile state');
        setHasProfile(false);
        clearAllLocalStorage();
      }
      setCheckingProfile(false);
    };

    // Always check when authentication state changes
    if (!isLoading) {
      checkProfile();
    }
  }, [user, isLoading, isAuthenticated, userId]);

  // Show loading spinner until both auth and profile check are done
  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading FLINGZZ...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated (logged out), show auth page
  if (!isAuthenticated || !user) {
    console.log('🚫 User not authenticated, showing auth page');
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <Toaster />
          <Sonner />
          <div id="recaptcha-container"></div>
          <Index onProfileComplete={recheckProfile} />
        </div>
      </TooltipProvider>
    );
  }

  // If user does NOT have a profile, show profile creation flow
  if (!hasProfile) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <Toaster />
          <Sonner />
          <div id="recaptcha-container"></div>
          <Index onProfileComplete={recheckProfile} />
        </div>
      </TooltipProvider>
    );
  }

  // Wrapper component to extra chatId from URL
  const ChatWrapper = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    return <RebuiltChatSystem onNavigate={(view) => navigate(`/${view}`)} selectedChatId={chatId} />;
  };

  // If user has a profile, show main app
  return (
    <TooltipProvider>
      <SocketChatProvider>
        <ChatNotificationProvider>
          <div className="min-h-screen bg-gradient-to-br from-background to-muted">
            <Toaster />
            <Sonner />
            <div id="recaptcha-container"></div>
            <Routes>
              <Route path="/" element={<FlingzzHome onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/swipe" element={<SwipePage onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/feed" element={<FeedPage onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/pairing" element={<PairingPage onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/matches" element={<MatchesPage onNavigate={(view) => navigate(`/${view}`)} />} />
              
              {/* --- Correctly integrated chat routes --- */}
              <Route 
                path="/chat" 
                element={<RebuiltChatSystem onNavigate={(view) => navigate(`/${view}`)} />} 
              />
              <Route 
                path="/chat/:chatId" 
                element={<ChatWrapper />} 
              />
              
              <Route path="/profile" element={<ProfilePage onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/blind-date" element={<BlindDatePage onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/subscription" element={<SubscriptionPage onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/qcs-test" element={<QCSTestPage />} />
              <Route path="/qcs-diagnostics" element={<QCSDiagnostics />} />
              <Route path="/qcs-repair" element={<QCSSystemRepair />} />
              {/* Redirect /home to root */}
              <Route path="/home" element={<Navigate to="/" replace />} />
              {/* Keep the catch-all route for other unknown routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </ChatNotificationProvider>
      </SocketChatProvider>
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