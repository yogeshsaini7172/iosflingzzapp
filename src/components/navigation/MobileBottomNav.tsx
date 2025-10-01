import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, MessageCircle } from "lucide-react";

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
    { path: "/chat", icon: MessageCircle, label: "Chat" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  // Don't render bottom nav in chat screens
  if (shouldHideBottomNav) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = active(path);
          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 flex-1 max-w-[120px] ${
                isActive
                  ? "bg-gradient-to-r from-primary to-primary-glow text-white shadow-glow transform scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "text-white" : ""}`} />
              <span className={`text-xs font-medium ${isActive ? "font-bold text-white" : ""}`}>
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