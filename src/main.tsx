import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { App } from "./App";
import "./index.css";
import "./services/fix-qcs"; // Auto-run QCS fix for existing profiles
import { initializeGoogleAuth } from "./mobile/googleAuth"; // Firebase wrapper

console.log("🚀 Starting FLINGZZ App...");

// Initialize Google Auth (updated for mobile compatibility)
console.log("✅ Mobile auth system initialized");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
