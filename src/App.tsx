import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { SocketChatProvider } from "./contexts/SocketChatContext";
import { ChatNotificationProvider } from "./contexts/ChatNotificationContext";
import { useState, useEffect } from "react";
import PairingPage from "./pages/PairingPage";
import ProfilePage from "./pages/ProfilePage";
import BlindDatePage from "./pages/BlindDatePage";
import FlingzzHome from "./components/campus/FlingzzHome";
import CommunityPage from "./pages/CommunityPage";

import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import QCSDiagnostics from "./components/QCSDiagnostics";
import QCSSystemRepair from "./components/QCSSystemRepair";
import QCSBulkSync from "./components/QCSBulkSync";
import { fetchWithFirebaseAuth } from "./lib/fetchWithFirebaseAuth";
import RebuiltChatSystem from "./components/chat/RebuiltChatSystem";
import { initializeMobileApp } from "./mobile/capacitor";
import LoadingScreen from "./components/ui/loading-screen";
import { WebLandingPage } from "./components/landing/WebLandingPage";
import AadhaarTest from './components/AadhaarTest';
import PublicAadhaarTest from './pages/PublicAadhaarTest';

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

  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileCheckComplete, setProfileCheckComplete] = useState(false);
  
  // Check if user has already dismissed landing page or is authenticated
  const [showLandingPage, setShowLandingPage] = useState(() => {
    const dismissed = localStorage.getItem('landing_dismissed');
    return dismissed !== 'true';
  });

  // Initialize mobile app
  useEffect(() => {
    initializeMobileApp();
  }, []);

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
      setCheckingProfile(true);
      const profileComplete = await checkUserProfile(userId);
      console.log('✅ Profile recheck result:', profileComplete);
      setHasProfile(!!profileComplete);
      setProfileCheckComplete(true);
      setCheckingProfile(false);
      return !!profileComplete;
    } catch (error) {
      console.error('❌ Error checking profile:', error);
      setHasProfile(false);
      setProfileCheckComplete(true);
      setCheckingProfile(false);
      return false;
    }
  };

  // Skip landing page for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ User authenticated, skipping landing page');
      setShowLandingPage(false);
      localStorage.setItem('landing_dismissed', 'true');
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    console.log('🔄 App starting, checking auth state...');
    const clearAllLocalStorage = () => {
      try {
        // Clear all localStorage items for fresh start (but keep landing_dismissed)
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
          setProfileCheckComplete(true);
        } catch (error) {
          console.error('❌ Error in profile check:', error);
          setHasProfile(false);
          setProfileCheckComplete(true);
        }
      } else {
        // User is not authenticated - reset profile state
        console.log('🚫 User not authenticated, resetting profile state');
        setHasProfile(false);
        setProfileCheckComplete(false);
        clearAllLocalStorage();
      }
      setCheckingProfile(false);
    };

    // Always check when authentication state changes
    if (!isLoading) {
      checkProfile();
    }
  }, [userId, isLoading, isAuthenticated]);

  // Show loading spinner until both auth and profile check are done
  if (isLoading || checkingProfile) {
    return (
      <LoadingScreen />
    );
  }

  // Public route for Aadhaar test (available without authentication)
  // Place this before auth gating so testers can access the page freely
  const isHashAadhaar = typeof window !== 'undefined' && (window.location.hash === '#/aadhaar-test' || window.location.hash === '#!/aadhaar-test');
  if (location.pathname === '/aadhaar-test' || isHashAadhaar) {
    return (
      <TooltipProvider>
        <PublicAadhaarTest />
      </TooltipProvider>
    );
  }

  // Show landing page only for non-authenticated users who haven't dismissed it
  if (showLandingPage && !isAuthenticated && !user) {
    return (
      <TooltipProvider>
        <div className="min-h-screen">
          <WebLandingPage onEnterApp={() => {
            setShowLandingPage(false);
            localStorage.setItem('landing_dismissed', 'true');
          }} />
        </div>
      </TooltipProvider>
    );
  }

  // If user is not authenticated, show auth page
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

  // If authenticated but profile check not complete or no profile, show profile setup
  if (isAuthenticated && user && (!profileCheckComplete || !hasProfile)) {
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
              <Route path="/pairing" element={<PairingPage onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/blind-date" element={<BlindDatePage onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/profile" element={<ProfilePage onNavigate={(view) => navigate(`/${view}`)} />} />
              <Route path="/community" element={<CommunityPage />} />
              
              {/* --- Chat routes --- */}
              <Route 
                path="/chat" 
                element={<RebuiltChatSystem onNavigate={(view) => navigate(`/${view}`)} />} 
              />
              <Route 
                path="/chat/:chatId" 
                element={<ChatWrapper />} 
              />
              {/* QCS Test page removed - was debug/test component */}
              <Route path="/qcs-diagnostics" element={<QCSDiagnostics />} />
              <Route path="/qcs-repair" element={<QCSSystemRepair />} />
              <Route path="/qcs-bulk-sync" element={<QCSBulkSync />} />
              <Route path="/aadhaar-test" element={<AadhaarTest />} />
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