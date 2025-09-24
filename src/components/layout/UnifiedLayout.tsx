import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from '@/hooks/useProfileData';
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/navigation/BottomNav";
import ChatNotificationBadge from '@/components/ui/chat-notification-badge';
import HeartNotificationBadge from '@/components/ui/heart-notification-badge';
import WhoLikedMeModal from '@/components/likes/WhoLikedMeModal';
import ChatRequestsModal from '@/components/notifications/ChatRequestsModal';
import LikeNotificationHandler from '@/components/swipe/LikeNotificationHandler';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';


interface UnifiedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

const UnifiedLayout = ({ children, title = "FLINGZZ", showHeader = true }: UnifiedLayoutProps) => {
  const { signOut } = useAuth();
  const { profile } = useProfileData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showWhoLikedMe, setShowWhoLikedMe] = useState(false);
  const [showChatRequests, setShowChatRequests] = useState(false);
  const [refreshLikes, setRefreshLikes] = useState(0);

  // Enable global notifications for all users - this ensures realtime notifications work everywhere
  useNotifications();
  
  // Enable centralized real-time notifications for all chat and matching activities
  useRealtimeNotifications();

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.clear(); // Clear all local storage
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Removed empty fetchLikes function

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Global notification handlers */}
      <LikeNotificationHandler />
      
      {/* Simplified Header with integrated navigation */}
      {showHeader && (
        <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <img src='logo.png' alt="FLINGZZ Logo" className="w-10 h-10 rounded-xl shadow-glow" />
                <div>
                  <h1 className="text-xl font-display font-bold text-gradient-primary">{title}</h1>
                  <p className="text-xs text-muted-foreground">Find your perfect match</p>
                </div>
              </div>

              {/* Right side - Notifications & Profile */}
              <div className="flex items-center space-x-3">
                <HeartNotificationBadge
                  onClick={() => setShowWhoLikedMe(true)}
                  refetch={refreshLikes}
                />
                <ChatNotificationBadge 
                  onClick={() => {
                    console.log('💬 Chat badge clicked - navigating to chat');
                    navigate('/chat');
                  }}
                />
                
                {/* Profile & Logout */}
                <div className="flex items-center space-x-2 pl-2 border-border/50">
                  <Avatar className="w-8 h-8">
                    {profile?.profile_images?.[0] ? (
                      <AvatarImage src={profile.profile_images[0]} alt="Profile" />
                    ) : (
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {profile?.first_name && (
                    <span className="font-medium text-sm text-primary-foreground">{profile.first_name}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Single Bottom Navigation */}
      <BottomNav />

      {/* Optional Modals - kept for flexibility */}
      <WhoLikedMeModal 
        isOpen={showWhoLikedMe} 
        onClose={() => setShowWhoLikedMe(false)} 
        onLike={() => setRefreshLikes(prev => prev + 1)}
      />
      <ChatRequestsModal 
        isOpen={showChatRequests} 
        onClose={() => setShowChatRequests(false)} 
      />
    </div>
  );
};

export default UnifiedLayout;