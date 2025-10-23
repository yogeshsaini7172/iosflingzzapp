import React from "react";
import { Home, Heart, Zap, MessageSquare, User } from "lucide-react";
import flingzzLogo from "@/assets/logo.png";

const Sidebar: React.FC = () => {
  const menuItems = [
    { label: "Home", icon: <Home size={20} />, active: true },
    { label: "Swipe", icon: <Heart size={20} /> },
    { label: "Pairing", icon: <Zap size={20} /> },
    { label: "Consulting", icon: <MessageSquare size={20} /> },
    { label: "Profile", icon: <User size={20} /> },
  ];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center gap-3">
        <img src={flingzzLogo} alt="FLINGZZ Logo" className="w-8 h-8 rounded-lg" />
        <h1 className="text-2xl font-bold text-primary">FLINGZZ</h1>
      </div>
      <nav className="space-y-4">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 text-lg cursor-pointer p-2 rounded-lg hover:bg-muted ${
              item.active ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
