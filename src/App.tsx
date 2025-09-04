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
import AuthScreen from "./components/auth/AuthScreen";
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
  const [profileCheckLoading, setProfileCheckLoading] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCurrentView('auth');
        setHasProfile(false);
        return;
      }

      setProfileCheckLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, is_active')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking profile:', error);
          setCurrentView('setup');
          setHasProfile(false);
          return;
        }

        if (data && data.first_name) {
          setHasProfile(true);
          setCurrentView('app');
          // Set user ID in localStorage for demo compatibility
          localStorage.setItem('demoUserId', user.id);
        } else {
          setCurrentView('setup');
          setHasProfile(false);
        }
      } catch (error) {
        console.error('Error in profile check:', error);
        setCurrentView('setup');
        setHasProfile(false);
      } finally {
        setProfileCheckLoading(false);
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

  // Loading state
  if (isLoading || profileCheckLoading) {
    return (
      <TooltipProvider>
        <GenZBackground variant="auth">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </GenZBackground>
      </TooltipProvider>
    );
  }

  // Not authenticated - show auth screen
  if (!user && currentView === 'auth') {
    return (
      <TooltipProvider>
        <GenZBackground variant="auth">
          <Toaster />
          <Sonner />
          <AuthScreen />
        </GenZBackground>
      </TooltipProvider>
    );
  }

  // Authenticated but no profile - show setup
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

  // Authenticated with profile - show main app
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