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

interface InstagramUIProps {
  onNavigate: (view: string) => void;
}

const InstagramUI = ({ onNavigate }: InstagramUIProps) => {
  const [activeTab, setActiveTab] = useState<
    "home" | "swipe" | "pairing" | "blinddate" | "profile"
  >("home");
  const { toast } = useToast();

  // ✅ Profiles feed from Supabase (only for Swipe tab)
  const { profiles = [], loading, setProfiles } = useProfilesFeed();

  // ✅ Paired profiles (only for Pairing tab)
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

  // ✅ Swipe handler
  const handleSwipe = async (id: string, direction: "left" | "right") => {
    console.log(`Swiped ${direction} on profile ${id}`);
    setProfiles((prev) => prev.filter((p) => p.id !== id));

    // TODO: Save swipe action to Supabase if required
  };

  // ✅ Subscription Plans
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

  // ✅ Main content per tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="flex-1 overflow-y-auto bg-black min-h-screen scroll-smooth relative">
            {/* GenZ Dark Header */}
            <header className="sticky top-0 z-20 backdrop-blur bg-black/80 border-b border-white/10">
              <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                  DatingSigma
                </h1>
                <span className="text-sm text-white/60 font-medium">Gen Z Dating 🔥</span>
              </div>
            </header>

            {/* Stories Section - GenZ Dark Theme */}
            <div className="px-4 py-6 border-b border-white/10 bg-black">
              <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
                {/* Add Story */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-white/30 rounded-full flex items-center justify-center mb-2">
                    <Plus className="w-6 h-6 text-white/70" />
                  </div>
                  <span className="text-xs text-white/60 font-medium">Your Story</span>
                </div>
                
                {/* Story Items */}
                {[
                  { name: "Alex", gradient: "from-purple-500 to-pink-500", emoji: "💜" },
                  { name: "Sam", gradient: "from-blue-500 to-cyan-500", emoji: "💙" },
                  { name: "Jordan", gradient: "from-pink-500 to-red-500", emoji: "❤️" },
                  { name: "Taylor", gradient: "from-green-500 to-teal-500", emoji: "💚" },
                  { name: "Casey", gradient: "from-yellow-500 to-orange-500", emoji: "🧡" },
                  { name: "Riley", gradient: "from-indigo-500 to-purple-500", emoji: "💜" },
                ].map((story, index) => (
                  <div key={story.name} className="flex-shrink-0 text-center">
                    <div 
                      className={`w-16 h-16 bg-gradient-to-br ${story.gradient} p-0.5 rounded-full mb-2 animate-pulse-glow`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-2xl">
                        {story.emoji}
                      </div>
                    </div>
                    <span className="text-xs text-white/80 font-medium">{story.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Feed - GenZ Dark Theme */}
            <div className="relative min-h-screen bg-black">
              {/* Neon Glow Effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl animate-pulse-glow delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-float delay-500"></div>
              </div>

              <div className="relative z-10 px-4 py-8">
                <div className="max-w-lg mx-auto space-y-6">
                  {/* Post Cards */}
                  {[
                    {
                      user: "midnight_vibes",
                      time: "2h",
                      content: "late night thoughts hit different when you're single ngl 🌙✨",
                      likes: "247",
                      gradient: "from-purple-600/20 to-black"
                    },
                    {
                      user: "coffee_addict_22",
                      time: "4h", 
                      content: "looking for someone who gets my 3am energy and doesn't judge my spotify wrapped 😅☕",
                      likes: "189",
                      gradient: "from-pink-600/20 to-black"
                    },
                    {
                      user: "aesthetic_soul",
                      time: "6h",
                      content: "manifesting a connection that feels like home 🏠💫 no fake energy pls",
                      likes: "312",
                      gradient: "from-blue-600/20 to-black"
                    }
                  ].map((post, index) => (
                    <div 
                      key={post.user}
                      className={`bg-gradient-to-br ${post.gradient} border border-white/10 rounded-2xl p-4 animate-fade-in backdrop-blur-sm`}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">@{post.user}</p>
                            <p className="text-white/60 text-xs">{post.time} ago</p>
                          </div>
                        </div>
                        <MoreHorizontal className="w-5 h-5 text-white/60" />
                      </div>
                      
                      {/* Post Content */}
                      <p className="text-white/90 text-sm leading-relaxed mb-4">
                        {post.content}
                      </p>
                      
                      {/* Post Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-2 text-white/60 hover:text-pink-400 transition-colors">
                            <Heart className="w-5 h-5" />
                            <span className="text-xs">{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-white/60 hover:text-blue-400 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-xs">{Math.floor(Math.random() * 50 + 10)}</span>
                          </button>
                          <button className="text-white/60 hover:text-green-400 transition-colors">
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                        <button className="text-white/60 hover:text-white transition-colors">
                          <Bookmark className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Call to Action Card */}
                  <div className="bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-blue-600/30 border border-white/20 rounded-2xl p-6 text-center animate-pulse-glow">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to find your vibe? ✨</h3>
                    <p className="text-white/70 text-sm mb-4">
                      Join thousands of Gen Z finding real connections, not just hookups
                    </p>
                    <button className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-bold py-3 rounded-full hover:scale-105 transition-all duration-300 shadow-lg">
                      Start Swiping 🔥
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Revolutionary Features Section */}
            <div className="relative py-24 bg-gradient-to-br from-muted/50 to-background overflow-hidden">

            </div>

            {/* Interactive Preferences Section */}
            <div className="relative py-24 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary))_1px,transparent_1px)] bg-[length:50px_50px]"></div>
              </div>

            </div>
          </div>
        );

      case "swipe":
        return (
          <div className="flex-1 overflow-y-auto">
            <SwipeCards />
          </div>
        );

      case "pairing":
        return (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <GhostBenchBar onChatSelected={() => onNavigate('chat')} />
            <PairingMatches />
          </div>
        );

      case "blinddate":
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="min-h-full bg-gradient-soft flex items-center justify-center p-4">
              <Card className="text-center p-8 shadow-medium border-0">
                <CardContent>
                  <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coffee className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Blind Date Experience</h2>
                  <p className="text-muted-foreground mb-6">
                    Connect with someone special without seeing their profile first. 
                  </p>
                  <p className="text-lg font-semibold text-orange-500 mb-6">
                    Coming Soon! 🎭
                  </p>
                  <Button onClick={() => setActiveTab('home')} className="bg-gradient-primary">
                    Back to Home
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Profile Management</h2>
                <p className="text-muted-foreground">View and manage your profile information</p>
              </div>
              
              {/* User Account Section */}
              <Card className="glass-luxury border-gradient shadow-premium">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gradient-primary">Account Settings</h3>
                      <p className="text-sm text-muted-foreground">Manage your account preferences</p>
                    </div>
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Demo User</p>
                          <p className="text-sm text-muted-foreground">demo@example.com</p>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">Active</Badge>
                    </div>
                    
                    <Button 
                      onClick={handleLogout}
                      variant="outline" 
                      className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* User Selector for Testing */}
              <UserSelector />
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center text-red-500">
            ❌ Nothing to render — activeTab: {activeTab}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Premium Header */}
      <div className="sticky top-0 z-40 glass-luxury border-b border-border/30 shadow-elegant">
        <div className="flex items-center justify-between px-6 py-4 backdrop-blur-xl">
          <h1 className="text-2xl font-elegant font-bold text-gradient-royal tracking-tight">
            DatingSigma
          </h1>
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("chat")}
              className="hover:bg-primary/10 transition-luxury rounded-full shadow-soft"
            >
              <MessageCircle className="w-6 h-6 text-primary" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-accent/10 transition-luxury rounded-full shadow-soft"
            >
              <Heart className="w-6 h-6 text-accent" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Premium Bottom Navigation */}
      <div className="sticky bottom-0 glass-luxury border-t border-border/30 shadow-premium">
        <div className="flex items-center justify-around py-6 px-4">
          {[
            { id: "home", icon: Home, label: "Home", gradient: "from-primary to-primary-glow" },
            { id: "swipe", icon: Heart, label: "Swipe", gradient: "from-accent to-accent-glow" },
            {
              id: "pairing",
              icon: Heart,
              label: "Pairing",
              gradient: "from-secondary to-secondary-glow",
            },
            {
              id: "blinddate",
              icon: Coffee,
              label: "Blind Date",
              gradient: "from-orange-500 to-orange-400",
            },
            {
              id: "profile",
              icon: User,
              label: "Profile",
              gradient: "from-primary-variant to-primary",
            },
          ].map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              className={`flex-col space-y-2 h-auto py-3 px-4 relative bg-transparent border-0 transition-luxury group ${
                activeTab === tab.id 
                  ? "scale-110 -translate-y-3 shadow-glow" 
                  : "hover:scale-105 hover:-translate-y-1 hover:shadow-soft"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <div className={`p-2 rounded-full bg-gradient-to-r ${tab.gradient} ${
                activeTab === tab.id ? 'shadow-premium animate-pulse-glow' : 'group-hover:shadow-royal'
              }`}>
                <tab.icon className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className={`text-xs font-modern font-medium ${
                activeTab === tab.id 
                  ? `bg-gradient-to-r ${tab.gradient} bg-clip-text text-transparent font-semibold` 
                  : 'text-foreground/70 group-hover:text-foreground'
              }`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-r ${tab.gradient} rounded-full animate-pulse-glow`}></div>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstagramUI;
