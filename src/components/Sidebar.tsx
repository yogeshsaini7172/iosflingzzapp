import React from "react";
import { Home, Heart, Zap, Users, User } from "lucide-react";

const Sidebar: React.FC = () => {
  const menuItems = [
    { label: "Home", icon: <Home size={20} />, active: true },
    { label: "Swipe", icon: <Heart size={20} /> },
    { label: "Pairing", icon: <Zap size={20} /> },
    { label: "Blind Date", icon: <Users size={20} /> },
    { label: "Profile", icon: <User size={20} /> },
  ];

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-2xl font-bold text-primary">FLINGZZ</h1>
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
