import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionEnforcementService } from "@/services/subscriptionEnforcement";
import { useOptionalAuth } from "@/hooks/useRequiredAuth";

interface HeartNotificationBadgeProps {
  onClick: () => void;
  className?: string;
}

const HeartNotificationBadge = ({ onClick, className }: HeartNotificationBadgeProps) => {
  const [likesCount, setLikesCount] = useState(0);
  const [canSeeLikes, setCanSeeLikes] = useState(false);
  const [loading, setLoading] = useState(true);
  const { userId, isAuthenticated } = useOptionalAuth();

  useEffect(() => {
    fetchLikesData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchLikesData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLikesData = async () => {
    if (!userId || !isAuthenticated) return;
    
    try {
      setLoading(true);
      
      // Check if user can see who liked them based on subscription
      const canSee = await SubscriptionEnforcementService.checkActionPermission('see_who_liked');
      setCanSeeLikes(canSee);
      
      if (canSee) {
        // Get actual likes count
        const result = await SubscriptionEnforcementService.getWhoLikedMe();
        if (result.success && result.data) {
          setLikesCount(result.data.count || 0);
        } else {
          setLikesCount(0);
        }
      } else {
        // Get count of users who liked but don't show details
        const { data: likesData, error } = await supabase
          .from("enhanced_swipes")
          .select("id")
          .eq("target_user_id", userId)
          .eq("direction", "right");

        if (error) throw error;
        setLikesCount(likesData?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching likes data:", error);
      setLikesCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (canSeeLikes) {
      onClick();
    } else {
      // Show upgrade prompt
      window.location.hash = 'upgrade';
    }
  };

  if (loading) {
    return (
      <div 
        className={`relative cursor-pointer ${className}`}
      >
        <Heart className="w-5 h-5 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (likesCount === 0) {
    return (
      <div 
        className={`relative cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <Heart className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <Heart className={`w-5 h-5 ${canSeeLikes ? 'text-red-500 fill-red-500' : 'text-red-400'}`} />
      {likesCount > 0 && (
        <Badge 
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center"
        >
          {canSeeLikes ? likesCount : '?'}
        </Badge>
      )}
    </div>
  );
};

export default HeartNotificationBadge;