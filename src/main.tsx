import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { App } from "./App";
import "./index.css";
// Removed auto-run QCS fix - now available as manual operation in admin debug page

console.log("🚀 Starting FLINGZZ App...");
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
