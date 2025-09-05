import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// REMOVED AUTH: import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
// REMOVED AUTH: import LoginPage from "./pages/LoginPage";
import DatingAppContainer from "./components/DatingAppContainer";
// REMOVED AUTH: import WelcomePage from "./components/WelcomePage";
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

function App() {
  const [currentView, setCurrentView] = useState<'auth' | 'setup' | 'app'>('auth');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const userId = localStorage.getItem("demoUserId");
    if (userId) {
      setIsLoggedIn(true);
      setCurrentView('app');
    }
  }, []);

  const handleLoginSuccess = (userId: string) => {
    setIsLoggedIn(true);
    setCurrentView('app');
  };

  const handleSignupSuccess = () => {
    setCurrentView('setup');
  };

  const handleProfileSetupComplete = () => {
    setIsLoggedIn(true);
    setCurrentView('app');
  };

  if (!isLoggedIn && currentView === 'auth') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <GenZBackground variant="auth">
            <Toaster />
            <Sonner />
            <LoginSignup 
              onLoginSuccess={handleLoginSuccess}
              onSignupSuccess={handleSignupSuccess}
            />
          </GenZBackground>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!isLoggedIn && currentView === 'setup') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <GenZBackground variant="setup">
            <Toaster />
            <Sonner />
            <ProfileSetupFlow onComplete={handleProfileSetupComplete} />
          </GenZBackground>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* REMOVED AUTH: <AuthProvider> */}
          <TooltipProvider>
            <GenZBackground variant="app">
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<DatingAppContainer />} />
                {/* REMOVED AUTH: <Route path="/login" element={<LoginPage />} /> */}
                <Route path="/app" element={<DatingAppContainer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </GenZBackground>
          </TooltipProvider>
        {/* REMOVED AUTH: </AuthProvider> */}
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export { App };