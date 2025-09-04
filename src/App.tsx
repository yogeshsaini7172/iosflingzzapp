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
    // Clear any existing demo data to start fresh
    localStorage.removeItem("demoUserId");
    localStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    setCurrentView('auth');
  }, []);

  const handleLoginSuccess = (userId: string) => {
    setIsLoggedIn(true);
    setCurrentView('app');
  };

  const handleSignupSuccess = () => {
    setCurrentView('setup');
  };

  const handleProfileSetupComplete = (userId: string) => {
    setIsLoggedIn(true);
    setCurrentView('app');
  };

  if (!isLoggedIn && currentView === 'auth') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LoginSignup 
            onLoginSuccess={handleLoginSuccess}
            onSignupSuccess={handleSignupSuccess}
          />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!isLoggedIn && currentView === 'setup') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ProfileSetupFlow onComplete={handleProfileSetupComplete} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* REMOVED AUTH: <AuthProvider> */}
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<DatingAppContainer />} />
              {/* REMOVED AUTH: <Route path="/login" element={<LoginPage />} /> */}
              <Route path="/app" element={<DatingAppContainer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        {/* REMOVED AUTH: </AuthProvider> */}
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export { App };