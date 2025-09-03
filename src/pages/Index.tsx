import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CampusConnectHome from "@/components/campus/CampusConnectHome";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "CampusConnect – Dashboard";
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with sign out */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">Dating App</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email ?? 'Guest'}
            </span>
            {user && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <CampusConnectHome onNavigate={(view) => console.log('Navigate to:', view)} />
      </div>
    </div>
  );
};

export default Index;