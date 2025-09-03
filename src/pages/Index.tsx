import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DatingApp from "@/components/DatingApp";
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
      {/* Show the dating app directly */}
      <DatingApp />
    </div>
  );
};

export default Index;