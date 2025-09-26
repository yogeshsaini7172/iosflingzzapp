import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Check if we're in a mobile environment
const isMobileEnvironment = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isCapacitor = userAgent.includes('Capacitor');
  const isWebView = window.location.href.includes('localhost') && (isMobile || isCapacitor);
  
  return isMobile || isCapacitor || isWebView;
};

console.log("📱 Detecting environment...");
console.log("📱 User Agent:", navigator.userAgent);
console.log("📱 Is Mobile:", isMobileEnvironment());

// Load appropriate app based on environment
if (isMobileEnvironment()) {
  console.log("📱 Loading Mobile App...");
  import("./mobile/MobileIndex").then((module) => {
    // Mobile app will handle its own rendering
  });
} else {
  console.log("🌐 Loading Web App...");
  import("./App").then(({ App }) => {
    import("./contexts/AuthContext").then(({ AuthProvider }) => {
      import("react-router-dom").then(({ BrowserRouter }) => {
        createRoot(document.getElementById("root")!).render(
          <StrictMode>
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </StrictMode>
        );
      });
    });
  });
}
