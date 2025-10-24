import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Simple loading screen while app initializes
function showLoadingScreen() {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;">
        <div style="text-align:center;color:#999;">
          <div style="width:64px;height:64px;margin:0 auto 12px;" class="animate-pulse">
            <!-- Inline heart SVG to match in-app heart loader -->
            <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" style="color:var(--primary);filter:drop-shadow(0 0 12px rgba(255,0,120,0.5));">
              <path d="M12 21s-7-4.35-9-7.02C1.26 10.9 3.18 6 6.9 6 8.8 6 10 7.2 12 9c2-1.8 3.2-3 5.1-3 3.72 0 5.64 4.9 3.9 7.98C19 16.65 12 21 12 21z"></path>
            </svg>
          </div>
          <div style="font-size:14px;margin-top:6px;color:var(--muted-foreground, #999);">Loading FLINGZZ...</div>
        </div>
      </div>
    `;
  }
}

// Check if we're in a mobile environment
const isMobileEnvironment = () => {
  try {
    if (typeof window === 'undefined') return false;
    
    const userAgent = window.navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isCapacitor = userAgent.includes('Capacitor');
    
    return isMobile || isCapacitor;
  } catch (error) {
    console.error("Error detecting environment:", error);
    return false;
  }
};

// Initialize app with error handling
async function initializeApp() {
  try {
    console.log("🚀 Starting FLINGZZ...");
    console.log("📱 User Agent:", navigator.userAgent);
    
    const isMobile = isMobileEnvironment();
    console.log("📱 Is Mobile:", isMobile);
    
    showLoadingScreen();
    
    if (isMobile) {
      console.log("📱 Loading Mobile App...");
      const { default: MobileApp } = await import("./mobile/MobileApp");
      
      createRoot(document.getElementById("root")!).render(
        <StrictMode>
          <MobileApp />
        </StrictMode>
      );
    } else {
      console.log("🌐 Loading Web App...");
      const { App } = await import("./App");
      const { AuthProvider } = await import("./contexts/AuthContext");
      const { BrowserRouter } = await import("react-router-dom");
      
      createRoot(document.getElementById("root")!).render(
        <StrictMode>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </StrictMode>
      );
    }
    
    console.log("✅ App initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    
    // Fallback: try to load web app
    try {
      console.log("🔄 Attempting fallback to web app...");
      const { App } = await import("./App");
      const { AuthProvider } = await import("./contexts/AuthContext");
      const { BrowserRouter } = await import("react-router-dom");
      
      createRoot(document.getElementById("root")!).render(
        <StrictMode>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </StrictMode>
      );
    } catch (fallbackError) {
      console.error("❌ Fallback failed:", fallbackError);
      const root = document.getElementById("root");
      if (root) {
        root.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; padding: 20px; text-align: center;">
            <div>
              <h1 style="color: #ff4444; margin-bottom: 16px;">Failed to Load</h1>
              <p style="color: #999; margin-bottom: 16px;">Please refresh the page or try again later.</p>
              <button onclick="window.location.reload()" style="background: #ff4444; color: #fff; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">
                Refresh Page
              </button>
            </div>
          </div>
        `;
      }
    }
  }
}

// Start the app
initializeApp();
