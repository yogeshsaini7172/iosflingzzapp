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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
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