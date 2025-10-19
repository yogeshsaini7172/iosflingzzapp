import React, { useEffect, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as Sonner } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MobileAuthProvider, useMobileAuth } from './MobileAuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketChatProvider } from '@/contexts/SocketChatContext';
import { ChatNotificationProvider } from '@/contexts/ChatNotificationContext';
import MobileAuthPage from './MobileAuthPage';
import ProfileSetupFlow from '@/components/profile/ProfileSetupFlow';
// Import pages
import ProfilePage from '@/pages/ProfilePage';
import PairingPage from '@/pages/PairingPage';
import BlindDatePage from '@/pages/BlindDatePage';

import Dashboard from '@/pages/Dashboard';
import FlingzzHome from '@/components/campus/FlingzzHome';
import QCSDiagnostics from '@/components/QCSDiagnostics';
import QCSSystemRepair from '@/components/QCSSystemRepair';
import QCSBulkSync from '@/components/QCSBulkSync';
import RebuiltChatSystem from '@/components/chat/RebuiltChatSystem';
import AadhaarTest from '@/components/AadhaarTest';
import NotFound from '@/pages/NotFound';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
// Debug components removed during cleanup
// import MobileFeatureDebug from '@/components/debug/MobileFeatureDebug';
// import APKFeatureVerification from '@/components/debug/APKFeatureVerification';
import { initializeMobileApp } from '../mobile/capacitor';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const MobileAppContent = () => {
  const { user, isLoading, isAuthenticated } = useMobileAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const navigate = useNavigate();

  // Initialize mobile app
  useEffect(() => {
    initializeMobileApp();
  }, []);

  // Check if user has completed profile
  const checkUserProfile = useCallback(async () => {
    if (!user?.uid) return false;
    
    setCheckingProfile(true);
    try {
      const res = await fetchWithFirebaseAuth('/functions/v1/data-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_profile' }),
      });
      
      if (!res.ok) {
        console.log('❌ Profile check failed:', res.status);
        return false;
      }
      
      const json = await res.json();
      const profile = json?.data?.profile;
      
      if (profile?.first_name && profile?.last_name && profile?.bio) {
        console.log('✅ Profile is complete');
        return true;
      }
      
      console.log('⚠️ Profile is incomplete or missing');
      return false;
    } catch (error) {
      console.error('❌ Error checking profile:', error);
      return false;
    } finally {
      setCheckingProfile(false);
    }
  }, [user?.uid]);

  // Check profile when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('📱 User authenticated, checking profile...');
      checkUserProfile().then(setHasProfile);
    } else {
      setHasProfile(false);
    }
  }, [isAuthenticated, user, checkUserProfile]);

  // Loading screen
  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading FLINGZZ...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth page
  if (!isAuthenticated) {
    return <MobileAuthPage />;
  }

  // Authenticated but no profile - show profile setup
  if (!hasProfile) {
    return (
      <ProfileSetupFlow 
        onComplete={async () => {
          console.log('📱 Profile setup complete, rechecking...');
          const profileComplete = await checkUserProfile();
          setHasProfile(profileComplete);
        }}
      />
    );
  }

  // Authenticated with profile - show main app
  const handleNavigate = (path: string) => {
    console.log('📱 Navigating to:', path);
    // Handle navigation paths
    const targetPath = `/${path}`;
    navigate(targetPath);
  };

  // Chat wrapper component for handling chat ID param
  const ChatWrapper = ({ chatId }: { chatId?: string }) => {
    return <RebuiltChatSystem onNavigate={handleNavigate} selectedChatId={chatId} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Root route - Home with swipe */}
        <Route path="/" element={<FlingzzHome onNavigate={handleNavigate} />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        
        {/* Core Features */}
        <Route path="/pairing" element={<PairingPage onNavigate={handleNavigate} />} />
        <Route path="/blind-date" element={<BlindDatePage onNavigate={handleNavigate} />} />
        <Route path="/profile" element={<ProfilePage onNavigate={handleNavigate} />} />
        
        {/* Chat System */}
        <Route path="/chat" element={<RebuiltChatSystem onNavigate={handleNavigate} />} />
        <Route path="/chat/:chatId" element={<ChatWrapper />} />
        
        {/* QCS System (Admin/Debug) */}
        {/* QCS Test page removed during cleanup */}
        <Route path="/qcs-diagnostics" element={<QCSDiagnostics />} />
        <Route path="/qcs-repair" element={<QCSSystemRepair />} />
        <Route path="/qcs-bulk-sync" element={<QCSBulkSync />} />
  <Route path="/aadhaar-test" element={<AadhaarTest />} />
        
        {/* Debug/Verification Tools - Removed during cleanup */}
        {/*         {/* Debug/Verification Tools - Removed during cleanup */}
        {/* <Route path="/verify-features" element={<APKFeatureVerification />} /> */}
        
        {/* 404 Handling */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <MobileBottomNav />
      
      {/* Debug Component (Development Only) */}
      {/* Debug component removed during cleanup */}
      {/* {process.env.NODE_ENV === 'development' && <MobileFeatureDebug />} */}
    </div>
  );
};

const MobileApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <MobileAuthProvider>
            <TooltipProvider>
              <SocketChatProvider>
                <ChatNotificationProvider>
                  <MobileAppContent />
                  <Toaster />
                  <Sonner />
                  <div id="recaptcha-container"></div>
                </ChatNotificationProvider>
              </SocketChatProvider>
            </TooltipProvider>
          </MobileAuthProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default MobileApp;