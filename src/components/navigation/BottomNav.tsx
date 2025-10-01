import { Link, useLocation } from "react-router-dom";
import { Home, Users, User } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();
  const active = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const items = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/chat", icon: Users, label: "Chat" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {items.map(({ path, icon: Icon, label }) => {
          const isActive = active(path);
          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[60px] ${
                isActive
                  ? "bg-gradient-to-r from-primary to-primary-glow text-white shadow-glow transform scale-110"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "text-white" : ""}`} />
              <span className={`text-xs font-professional font-medium ${isActive ? "font-bold" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
