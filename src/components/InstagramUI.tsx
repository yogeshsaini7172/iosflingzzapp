import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  Heart,
  MessageCircle,
  User,
  Zap,
  Coffee,
  Shield,
  Brain,
  Star,
  MapPin,
  Send,
  Bookmark,
  Plus,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfilesFeed } from "@/hooks/useProfilesFeed";
import { usePairing } from "@/hooks/usePairing";
import UserSelector from "@/components/debug/UserSelector";
import SwipeCards from "@/components/swipe/SwipeCards";
import PairingMatches from "@/components/pairing/PairingMatches";
import GhostBenchBar from "@/components/ui/ghost-bench-bar";
import { useToast } from "@/hooks/use-toast";
import EnhancedProfileDisplay from "@/components/profile/EnhancedProfileDisplay";

interface InstagramUIProps {
  onNavigate: (view: string) => void;
}

const InstagramUI = ({ onNavigate }: InstagramUIProps) => {
  const [activeTab, setActiveTab] = useState<
    "home" | "pairing" | "blinddate" | "profile"
  >("home");
  const { toast } = useToast();

  // Profiles feed from Supabase (only for Swipe tab)
  const { profiles = [], loading, setProfiles } = useProfilesFeed();

  // Paired profiles (only for Pairing tab)
  const { pairedProfiles = [], loading: pairingLoading } = usePairing();

  // Handle logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out"
      });
      
      // Clear any stored demo data
      localStorage.removeItem('demoProfile');
      localStorage.removeItem('demoPreferences');
      localStorage.removeItem('demoUserId');
      localStorage.removeItem('demoQCS');
      
      // Navigate back to welcome/login page
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Logout error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Swipe handler
  const handleSwipe = async (id: string, direction: "left" | "right") => {
    console.log(`Swiped ${direction} on profile ${id}`);
    setProfiles((prev) => prev.filter((p) => p.id !== id));

    // TODO: Save swipe action to Supabase if required
  };


  // Subscription Plans
  const plans = [
    {
      id: 1,
      name: "Basic",
      price: "₹49 / month",
      features: ["10 Swipes per day", "Basic Matching", "Chat with Matches"],
      color: "border-blue-500",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: 2,
      name: "Premium",
      price: "₹89 / month",
      features: [
        "Unlimited Swipes",
        "Smart AI Pairing",
        "Priority Matches",
        "See Who Liked You",
      ],
      color: "border-purple-500",
      buttonColor: "bg-purple-500 hover:bg-purple-600",
    },
    {
      id: 3,
      name: "Elite",
      price: "₹129 / month",
      features: [
        "Everything in Premium",
        "Exclusive Elite Profiles",
        "1 Blind Date Credit Daily",
        "VIP Support",
      ],
      color: "border-yellow-500",
      buttonColor: "bg-yellow-500 hover:bg-yellow-600",
    },
  ];

  const renderPlans = () => (
    <div className="grid gap-6">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`border-2 ${plan.color} shadow-md rounded-xl`}
        >
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-2xl font-semibold mb-4">{plan.price}</p>

            <ul className="space-y-2 mb-4 text-sm text-gray-600">
              {plan.features.map((f, idx) => (
                <li key={idx}>✅ {f}</li>
              ))}
            </ul>

            <Button
              className={`w-full text-white ${plan.buttonColor}`}
              onClick={() => alert(`Subscribed to ${plan.name}`)}
            >
              Subscribe
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Main content per tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="flex-1 overflow-y-auto bg-black min-h-screen scroll-smooth relative">
            {/* Instagram-style responsive header */}
            <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/40 border-b border-white/10 safe-area-top">
              <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                    <span className="text-white font-bold text-lg sm:text-xl">💕</span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                    datingSigma
                  </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    className="touch-feedback genZ-hover-lift p-2 sm:p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 min-w-[44px] min-h-[44px]"
                    aria-label="Notifications"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                  </button>
                  <span className="text-xs sm:text-sm text-white/80 font-medium hidden sm:block">GenZ Dating 🔥</span>
                </div>
              </div>
            </header>

            {/* Stories Section - Enhanced GenZ Theme */}
            <div className="px-4 py-6 border-b border-white/10 bg-transparent">
              <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                {/* Horizontal Small Cards */}
                {[
                  {
                    user: "midnight_vibes",
                    time: "2h",
                    content: "late night thoughts hit different...",
                    likes: "247",
                    avatar: "🌙",
                    gradient: "from-purple-600/30 to-pink-600/30"
                  },
                  {
                    user: "coffee_addict_22", 
                    time: "4h",
                    content: "looking for someone who gets my 3am energy...",
                    likes: "189",
                    avatar: "☕",
                    gradient: "from-pink-600/30 to-red-600/30"
                  },
                  {
                    user: "aesthetic_soul",
                    time: "6h", 
                    content: "manifesting a connection that feels like home...",
                    likes: "312",
                    avatar: "✨",
                    gradient: "from-blue-600/30 to-cyan-600/30"
                  },
                  {
                    user: "vibe_check",
                    time: "8h", 
                    content: "anyone else obsessed with late night drives...",
                    likes: "156",
                    avatar: "🚗",
                    gradient: "from-green-600/30 to-teal-600/30"
                  }
                ].map((post, index) => (
                  <div 
                    key={post.user}
                    className={`flex-shrink-0 w-72 bg-gradient-to-br ${post.gradient} border border-white/10 rounded-2xl p-4 backdrop-blur-sm animate-fade-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Card Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg">
                        {post.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-xs truncate">@{post.user}</p>
                        <p className="text-white/60 text-xs">{post.time} ago</p>
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <p className="text-white/90 text-xs leading-relaxed mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    
                    {/* Card Actions */}
                    <div className="flex items-center justify-between">
                      <button className="flex items-center space-x-1 text-white/60 hover:text-pink-400 transition-colors">
                        <Heart className="w-3 h-3" />
                        <span className="text-xs">{post.likes}</span>
                      </button>
                      <button className="text-white/60 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-3 h-3" />
                      </button>
                      <button className="text-white/60 hover:text-green-400 transition-colors">
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Feed - Enhanced GenZ Theme */}
            <div className="relative min-h-screen bg-transparent">
              {/* Neon Glow Effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl animate-pulse-glow delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-float delay-500"></div>
              </div>

              <div className="relative z-10 px-4 py-8">
                {/* GenZ Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-10 left-10 text-6xl opacity-20 animate-float">💜</div>
                  <div className="absolute top-40 right-20 text-4xl opacity-30 animate-pulse delay-1000">✨</div>
                  <div className="absolute bottom-60 left-20 text-5xl opacity-25 animate-bounce delay-500">🔥</div>
                  <div className="absolute top-80 left-1/2 text-3xl opacity-20 animate-spin">💫</div>
                  <div className="absolute bottom-40 right-10 text-4xl opacity-30 animate-pulse delay-2000">🌙</div>
                  <div className="absolute top-60 right-1/4 text-2xl opacity-25 animate-bounce delay-1500">💕</div>
                  
                  {/* Floating geometric shapes */}
                  <div className="absolute top-20 right-1/3 w-8 h-8 bg-pink-400/20 rotate-45 animate-float delay-700"></div>
                  <div className="absolute bottom-80 left-1/3 w-6 h-6 bg-purple-400/20 rounded-full animate-pulse delay-1200"></div>
                  <div className="absolute top-1/2 right-10 w-4 h-16 bg-blue-400/20 rotate-12 animate-bounce delay-800"></div>
                </div>

                  <div className="max-w-lg mx-auto space-y-6 relative z-10">
                    {/* Enhanced Swipe Interface */}
                    <SwipeCards />


                    {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="text-2xl font-bold text-white">47</div>
                      <div className="text-white/70 text-sm">Likes Today</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="text-2xl font-bold text-white">12</div>
                      <div className="text-white/70 text-sm">Matches</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="text-2xl font-bold text-white">5</div>
                      <div className="text-white/70 text-sm">Messages</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "pairing":
        return (
          <div className="min-h-screen bg-black p-4">
            <div className="max-w-lg mx-auto">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">AI Pairing</h1>
                <p className="text-white/70">Smart matches based on compatibility</p>
              </div>
              <PairingMatches />
            </div>
          </div>
        );

      case "blinddate":
        return (
          <div className="min-h-screen bg-black p-4">
            <div className="max-w-lg mx-auto">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Blind Date</h1>
                <p className="text-white/70">Anonymous connections await</p>
              </div>
              <div className="space-y-4">
                <Card className="bg-white/10 border-white/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Coffee className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Start Blind Date</h3>
                    <p className="text-white/70 mb-4">Connect with someone new without seeing their profile first</p>
                    <Button 
                      onClick={() => onNavigate('blind-date')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white w-full"
                    >
                      Begin Anonymous Chat
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="min-h-screen bg-black p-4">
            <EnhancedProfileDisplay />
            <div className="mt-6 text-center">
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                Logout
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-black text-white min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Debug Tools */}
      <div className="relative z-50">
        <UserSelector />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <GhostBenchBar 
        onChatSelected={(chatId) => {
          console.log('Chat selected:', chatId);
          onNavigate('chat');
        }}
      />
    </div>
  );
};

export default InstagramUI;