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
  const { user, isLoading } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Function to check if user has completed profile
  const checkUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      return profile && profile.first_name && profile.university;
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    }
  };

  // Function to recheck profile status
  const recheckProfile = async () => {
    if (!user) return false;
    
    const profileComplete = await checkUserProfile(user.id);
    setHasProfile(!!profileComplete);
    return !!profileComplete;
  };

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        const profileComplete = await checkUserProfile(user.id);
        setHasProfile(!!profileComplete);
      }
      setCheckingProfile(false);
    };

    if (!isLoading) {
      checkProfile();
    }
  }, [user, isLoading]);

  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show authentication/profile setup flow if user not authenticated or profile incomplete
  if (!user || !hasProfile) {
    return (
      <TooltipProvider>
        <GenZBackground variant="app">
          <Toaster />
          <Sonner />
          <div id="recaptcha-container"></div>
          <Index onProfileComplete={recheckProfile} />
        </GenZBackground>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <GenZBackground variant="app">
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
          }} />} />
          <Route path="/swipe" element={<SwipePage onNavigate={(view) => {}} />} />
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