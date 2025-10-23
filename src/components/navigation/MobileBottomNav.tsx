import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, Sparkles, User } from "lucide-react";
import { hapticLight } from "@/utils/hapticFeedback";

const MobileBottomNav = () => {
  const location = useLocation();
  
  const active = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Hide bottom nav when in chat (individual chat pages)
  const shouldHideBottomNav = location.pathname.startsWith("/chat/") || 
                            location.pathname === "/chat";

  // Bottom navigation items
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/pairing", icon: Users, label: "Pairing" },
    { path: "/blind-date", icon: Sparkles, label: "Blind Date" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  // Don't render bottom nav in chat screens
  if (shouldHideBottomNav) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-40 safe-area-bottom overflow-hidden"
         style={{ height: 'clamp(56px, 13vw, 68px)' }}>
      <div className="flex items-center justify-around h-full max-w-md mx-auto overflow-hidden" style={{ padding: '0 clamp(4px, 2vw, 6px)' }}>
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = active(path);
          // Slightly smaller icons and reduced active scaling to avoid overflow on small screens (APK)
          const isCenter = label.toLowerCase() === 'blind date' || label.toLowerCase() === 'pairing' || label.toLowerCase() === 'home';
          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              onClick={() => hapticLight()}
              className={`flex flex-col items-center justify-center rounded-xl transition-all duration-200 transform-none flex-1 ${
                isActive
                  ? "bg-gradient-to-r from-primary to-primary-glow text-white shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              style={{ 
                padding: 'clamp(4px, 1.5vw, 6px)',
                maxWidth: 'clamp(64px, 20vw, 110px)'
              }}
            >
              <Icon
                className={`${isActive ? "text-white mb-1" : "mb-1"} transform-none`} 
                style={{
                  // Use fixed pixel caps to avoid subpixel scaling differences in webview/APK
                  width: isCenter ? '18px' : '16px',
                  height: isCenter ? '18px' : '16px',
                }}
                aria-hidden
              />
              <span className={`font-medium ${isActive ? "font-bold text-white" : ""}`}
                    style={{ fontSize: 'clamp(0.55rem, 2vw, 0.7rem)' }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;