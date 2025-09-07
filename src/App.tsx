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
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import GenZBackground from "./components/ui/genZ-background";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const AuthenticatedApp = () => {
  // Bypass auth - always show app content
  const [hasProfile, setHasProfile] = useState(true); // Always true for bypass
  const [checkingProfile, setCheckingProfile] = useState(false);

  // Mock user object for bypassed auth
  const user = { uid: '11111111-1111-1111-1111-111111111001' };
  const isLoading = false;

  // Add a function to recheck profile status
  const recheckProfile = async () => {
    // Bypass auth - always return true
    return true;
  };

  // Bypass loading states
  if (false) { // Never loading
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Bypass auth checks - always show app content
  // No user or profile checks needed

  return (
    <TooltipProvider>
      <GenZBackground variant="app">
        <Navbar />
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
          }} />} />
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