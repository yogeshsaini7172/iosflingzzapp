import { useState, useEffect } from "react";
import {
  Heart,
  User,
  MessageCircle,
  Search,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import Loader from '@/components/ui/Loader';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type View =
  | "dashboard"
  | "swipe"
  | "pairing"
  | "matches"
  | "chat"
  | "profile"
  | "consulting";

interface User {
  id: string;
  email: string;
  name: string;
  profile: any;
}

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
}

const AppLayout = ({ children, currentView, onViewChange }: AppLayoutProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const navItems = [
    {
      id: "dashboard" as View,
      label: "Dashboard",
      icon: <Sparkles className="h-5 w-5" />,
      description: "Overview & Stats",
    },
    {
      id: "swipe" as View,
      label: "Swipe",
      icon: <Heart className="h-5 w-5" />,
      description: "Discover People",
      badge: "Hot",
    },
    {
      id: "pairing" as View,
      label: "Smart Pairing",
      icon: <Search className="h-5 w-5" />,
      description: "AI Matching",
      badge: "Premium",
    },
    {
      id: "matches" as View,
      label: "Matches",
      icon: <User className="h-5 w-5" />,
      description: "Your Connections",
    },
    {
      id: "chat" as View,
      label: "Messages",
      icon: <MessageCircle className="h-5 w-5" />,
      description: "Conversations",
    },
    {
      id: "consulting" as View,
      label: "Consulting",
      icon: <MessageSquare className="h-5 w-5" />,
      description: "Get Advice",
    },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-elegant">
        <div className="text-center">
          <Loader size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-80 bg-gradient-card border-r border-border/50 flex flex-col shadow-medium">
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-elegant font-bold text-gradient-primary">
                  GradSync
                </h1>
                <p className="text-xs text-muted-foreground">
                  Connect & Fling
                </p>
              </div>
            </div>

            {/* User Info */}
            <Card className="p-4 bg-gradient-subtle border-border/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{currentUser.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {currentUser.profile?.university}
                  </p>
                  <div className="flex items-center mt-1">
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      QCS: {currentUser.profile?.total_qcs || "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "default" : "ghost"}
                className={`w-full justify-start h-auto p-4 transition-elegant ${
                  currentView === item.id
                    ? "bg-gradient-primary text-white shadow-royal"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onViewChange(item.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs opacity-80">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <Badge
                      variant={
                        item.badge === "Premium" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onViewChange("profile")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content + Right Sidebar */}
        <div className="flex-1 flex">
          {/* Main Feed */}
          <div className="flex-1 overflow-y-auto">{children}</div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-96 border-l border-border/50 p-6 bg-white">
            <h2 className="text-xl font-bold mb-4">Dashboard</h2>

            <div className="bg-gradient-subtle rounded-xl p-4 mb-4">
              <h3 className="font-semibold">Match Insights</h3>
              <p className="text-sm text-muted-foreground">
                You have 12 new likes today 🎉
              </p>
            </div>

            <div className="bg-gradient-subtle rounded-xl p-4">
              <h3 className="font-semibold mb-2">Recent Activity</h3>
              <ul className="text-sm space-y-1">
                <li>Emma viewed your profile</li>
                <li>David sent you a like</li>
                <li>Anna matched with you</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
