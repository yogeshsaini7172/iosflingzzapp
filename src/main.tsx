import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { App } from "./App";
import "./index.css";
import "./services/fix-qcs"; // Auto-run QCS fix for existing profiles

console.log("🚀 Starting FLINGZZ App...");
console.log("✅ Mobile auth system ready");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
