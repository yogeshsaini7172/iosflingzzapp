import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SwipePage from "./pages/SwipePage";
import PairingPage from "./pages/PairingPage";
import MatchesPage from "./pages/MatchesPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import BlindDatePage from "./pages/BlindDatePage";
import HomePage from "./pages/HomePage";
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
  const { user, isLoading } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) {
        setHasProfile(false);
        return;
      }

      setCheckingProfile(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, university, verification_status, total_qcs')
          .eq('user_id', user.uid)
          .maybeSingle();

        const profileComplete = !!profile && (
          profile.verification_status === 'verified' ||
          (!!profile.first_name && !!profile.university) ||
          (typeof profile.total_qcs === 'number' && profile.total_qcs > 0)
        );
        setHasProfile(profileComplete);
        
        console.log('Profile check:', { 
          userId: user.uid, 
          hasProfile: !!profileComplete,
          profileData: profile 
        });
      } catch (error) {
        console.error('Error checking profile:', error);
        setHasProfile(false);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!isLoading) {
      checkUserProfile();
    }
  }, [user, isLoading]);

  // Add a function to recheck profile status
  const recheckProfile = async () => {
    console.log('Rechecking profile status...');
    if (user) {
      setCheckingProfile(true);
      try {
        // Add a small delay to ensure database has been updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, university, verification_status, total_qcs')
          .eq('user_id', user.uid)
          .maybeSingle();

        const profileComplete = !!profile && (
          profile.verification_status === 'verified' ||
          (!!profile.first_name && !!profile.university) ||
          (typeof profile.total_qcs === 'number' && profile.total_qcs > 0)
        );
        setHasProfile(profileComplete);
        
        console.log('Profile recheck result:', { 
          userId: user.uid, 
          hasProfile: !!profileComplete,
          profileData: profile
        });
        
        return !!profileComplete;
      } catch (error) {
        console.error('Error rechecking profile:', error);
        return false;
      } finally {
        setCheckingProfile(false);
      }
    }
    return false;
  };

  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user or user doesn't have complete profile, show Index (auth/profile setup)
  if (!user || !hasProfile) {
    return <Index onProfileComplete={recheckProfile} />;
  }

  return (
    <TooltipProvider>
      <GenZBackground variant="app">
        <Toaster />
        <Sonner />
        <div id="recaptcha-container"></div>
        <Routes>
          <Route path="/" element={<HomePage onNavigate={(view) => {}} />} />
          <Route path="/swipe" element={<SwipePage onNavigate={(view) => {}} />} />
          <Route path="/pairing" element={<PairingPage onNavigate={(view) => {}} />} />
          <Route path="/matches" element={<MatchesPage onNavigate={(view) => {}} />} />
          <Route path="/chat/:matchId?" element={<ChatPage onNavigate={(view) => {}} />} />
          <Route path="/profile" element={<ProfilePage onNavigate={(view) => {}} />} />
          <Route path="/blind-date" element={<BlindDatePage onNavigate={(view) => {}} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </GenZBackground>
    </TooltipProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export { App };