import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { MobileAuthProvider, useMobileAuth } from './MobileAuthContext';
import MobileAuthPage from './MobileAuthPage';
import ProfileSetupFlow from '@/components/profile/ProfileSetupFlow';
import SwipePage from '@/pages/SwipePage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import MatchesPage from '@/pages/MatchesPage';
import BottomNav from '@/components/navigation/BottomNav';
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

  // Initialize mobile app
  useEffect(() => {
    initializeMobileApp();
  }, []);

  // Check if user has completed profile
  const checkUserProfile = async () => {
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
  };

  // Check profile when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('📱 User authenticated, checking profile...');
      checkUserProfile().then(setHasProfile);
    } else {
      setHasProfile(false);
    }
  }, [isAuthenticated, user]);

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
    // Navigation is handled by React Router
  };

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Navigate to="/swipe" replace />} />
        <Route path="/swipe" element={<SwipePage onNavigate={handleNavigate} />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
        <Route path="/matches" element={<MatchesPage onNavigate={handleNavigate} />} />
        <Route path="/profile" element={<ProfilePage onNavigate={handleNavigate} />} />
        <Route path="*" element={<Navigate to="/swipe" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
};

const MobileApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <MobileAuthProvider>
          <MobileAppContent />
          <Toaster />
        </MobileAuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default MobileApp;