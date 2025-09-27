import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, User, MessageCircle, Heart, Menu } from "lucide-react";
import MobileFeaturesMenu from "./MobileFeaturesMenu";

const MobileBottomNav = () => {
  const location = useLocation();
  const [showFeaturesMenu, setShowFeaturesMenu] = useState(false);
  
  const active = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Hide bottom nav when in chat (individual chat pages)
  const shouldHideBottomNav = location.pathname.startsWith("/chat/") || 
                            location.pathname === "/chat";

  // Mobile-optimized navigation without swipe (3 main tabs + More button)
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
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = active(path);
            return (
              <Link
                key={path}
                to={path}
                aria-label={label}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[60px] ${
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
          
          {/* More/Menu Button */}
          <button
            onClick={() => setShowFeaturesMenu(true)}
            aria-label="More features"
            className="flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[60px] text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <Menu className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Features Menu */}
      <MobileFeaturesMenu 
        isOpen={showFeaturesMenu} 
        onClose={() => setShowFeaturesMenu(false)} 
      />
    </>
  );
};

export default MobileBottomNav;