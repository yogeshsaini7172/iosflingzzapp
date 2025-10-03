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
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-40 safe-area-bottom"
         style={{ height: 'clamp(60px, 15vw, 72px)' }}>
      <div className="flex items-center justify-around h-full max-w-md mx-auto" style={{ padding: '0 clamp(4px, 2vw, 8px)' }}>
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = active(path);
          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              onClick={() => hapticLight()}
              className={`flex flex-col items-center justify-center rounded-xl transition-all duration-300 flex-1 active:scale-95 ${
                isActive
                  ? "bg-gradient-to-r from-primary to-primary-glow text-white shadow-glow transform scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              style={{ 
                padding: 'clamp(6px, 2vw, 8px)',
                maxWidth: 'clamp(80px, 22vw, 120px)'
              }}
            >
              <Icon className={isActive ? "text-white mb-1" : "mb-1"} 
                    style={{ width: 'clamp(18px, 5vw, 20px)', height: 'clamp(18px, 5vw, 20px)' }} />
              <span className={`font-medium ${isActive ? "font-bold text-white" : ""}`}
                    style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
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