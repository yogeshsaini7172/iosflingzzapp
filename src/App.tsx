import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import DatingAppContainer from "./components/DatingAppContainer";
import NotFound from "./pages/NotFound";
import LoginSignup from "./pages/LoginSignup";
import ProfileSetupFlow from "./components/profile/ProfileSetupFlow";
import GenZBackground from "./components/ui/genZ-background";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user, session, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'auth' | 'setup' | 'app'>('auth');
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setHasProfile(true);
          setCurrentView('app');
        } else {
          setCurrentView('setup');
        }
      } else {
        setCurrentView('auth');
      }
    };

    if (!isLoading) {
      checkProfile();
    }
  }, [user, isLoading]);

  const handleProfileSetupComplete = () => {
    setHasProfile(true);
    setCurrentView('app');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && currentView === 'auth') {
    return (
      <TooltipProvider>
        <GenZBackground variant="auth">
          <Toaster />
          <Sonner />
          <LoginSignup 
            onLoginSuccess={() => {}}
            onSignupSuccess={() => {}}
          />
        </GenZBackground>
      </TooltipProvider>
    );
  }

  if (user && !hasProfile && currentView === 'setup') {
    return (
      <TooltipProvider>
        <GenZBackground variant="setup">
          <Toaster />
          <Sonner />
          <ProfileSetupFlow onComplete={handleProfileSetupComplete} />
        </GenZBackground>
      </TooltipProvider>
    );
  }

  return (
    <BrowserRouter>
      <TooltipProvider>
        <GenZBackground variant="app">
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<DatingAppContainer />} />
            <Route path="/app" element={<DatingAppContainer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </GenZBackground>
      </TooltipProvider>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <AppContent />
    </QueryClientProvider>
  );
}

export { App };