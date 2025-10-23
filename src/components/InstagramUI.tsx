import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  Heart,
  MessageCircle,
  User,
  Users,
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
// Debug component removed during cleanup
// import UserSelector from "@/components/debug/UserSelector";
import SwipeCards from "@/components/swipe/SwipeCards";
import PairingMatches from "@/components/pairing/PairingMatches";
import EnhancedProfileDisplay from "@/components/profile/EnhancedProfileDisplay";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface InstagramUIProps {
  onNavigate: (view: string) => void;
}

const InstagramUI = ({ onNavigate }: InstagramUIProps) => {
  const location = useLocation();
  // Fix active tab detection for new routing
  const activeTab = location.pathname === '/swipe' ? 'home' : location.pathname.substring(1);
  const { toast } = useToast();

  // ✅ Profiles feed from Supabase (only for Swipe tab)
  const { profiles = [], loading, setProfiles } = useProfilesFeed();

  // ✅ Paired profiles (only for Pairing tab)
  const { pairedProfiles = [], loading: pairingLoading } = usePairing();

  // Handle logout with Firebase
  const handleLogout = async () => {
    try {
      const { signOut } = useAuth();
      await signOut();
      
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
        description: error.message || "Failed to logout",
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
      color: "border-primary/30",
      buttonColor: "bg-primary/80 hover:bg-primary",
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
      color: "border-secondary/30",
      buttonColor: "bg-secondary/80 hover:bg-secondary",
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
      color: "border-accent/30",
      buttonColor: "bg-accent/80 hover:bg-accent",
    },
  ];

  // ✅ Main content per tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
      case "swipe":
        return (
          <div className="flex-1 overflow-y-auto bg-background min-h-screen scroll-smooth relative">
            {/* Instagram-style responsive header */}
            <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border safe-area-top">
              <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                    <span className="text-primary-foreground font-bold text-lg sm:text-xl">💕</span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
                    FLINGZZ
                  </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    className="touch-feedback genZ-hover-lift p-2 sm:p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border text-foreground hover:bg-card/70 min-w-[44px] min-h-[44px]"
                    aria-label="Notifications"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                  </button>
                  <span className="text-xs sm:text-sm text-muted-foreground font-professional font-medium hidden sm:block">GenZ Dating 🔥</span>
                </div>
              </div>
            </header>

            {/* Stories Section - Enhanced GenZ Theme */}
            <div className="px-4 py-6 border-b border-border bg-transparent">
              <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                {/* Horizontal Small Cards */}
                {[
                  {
                    user: "midnight_vibes",
                    time: "2h",
                    content: "late night thoughts hit different...",
                    likes: "247",
                    avatar: "🌙",
                    gradient: "from-primary/30 to-secondary/30"
                  },
                  {
                    user: "coffee_addict_22", 
                    time: "4h",
                    content: "looking for someone who gets my 3am energy...",
                    likes: "189",
                    avatar: "☕",
                    gradient: "from-secondary/30 to-accent/30"
                  },
                  {
                    user: "aesthetic_soul",
                    time: "6h", 
                    content: "manifesting a connection that feels like home...",
                    likes: "312",
                    avatar: "✨",
                    gradient: "from-accent/30 to-primary/30"
                  },
                  {
                    user: "vibe_check",
                    time: "8h", 
                    content: "anyone else obsessed with late night drives...",
                    likes: "156",
                    avatar: "🚗",
                    gradient: "from-muted/30 to-secondary/30"
                  }
                ].map((post, index) => (
                  <div 
                    key={post.user}
                    className={`flex-shrink-0 w-72 bg-gradient-to-br ${post.gradient} border border-border rounded-2xl p-4 backdrop-blur-sm animate-fade-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Card Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-lg">
                        {post.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-professional font-semibold text-xs truncate">@{post.user}</p>
                        <p className="text-muted-foreground font-professional text-xs">{post.time} ago</p>
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <p className="text-foreground/90 font-professional text-xs leading-relaxed mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    
                    {/* Card Actions */}
                    <div className="flex items-center justify-between">
                      <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
                        <Heart className="w-3 h-3" />
                        <span className="text-xs">{post.likes}</span>
                      </button>
                      <button className="text-muted-foreground hover:text-secondary transition-colors">
                        <MessageCircle className="w-3 h-3" />
                      </button>
                      <button className="text-muted-foreground hover:text-accent transition-colors">
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
              </div>

              <div className="relative z-10 px-4 py-8">
                <div className="max-w-lg mx-auto space-y-6 relative z-10">
                  {/* Swipe Cards Container */}
                  <div className="relative h-[600px] perspective-1000">
                    {/* Profile Cards Stack */}
                    {[
                      {
                        id: 1,
                        name: "Alex",
                        age: 22,
                        distance: "2 km away",
                        bio: "Coffee enthusiast ☕ | Night owl 🌙 | Looking for genuine connections",
                        image: "🌸",
                        interests: ["Photography", "Music", "Travel"],
                        gradient: "from-primary/80 to-secondary/80",
                        zIndex: 3
                      },
                      {
                        id: 2,
                        name: "Sam",
                        age: 24,
                        distance: "5 km away", 
                        bio: "Adventure seeker 🏔️ | Dog lover 🐕 | Weekend hiker",
                        image: "🌺",
                        interests: ["Hiking", "Dogs", "Cooking"],
                        gradient: "from-secondary/80 to-accent/80",
                        zIndex: 2
                      },
                      {
                        id: 3,
                        name: "Jordan",
                        age: 23,
                        distance: "3 km away",
                        bio: "Artist at heart 🎨 | Vinyl collector 📼 | Seeking creativity",
                        image: "🌻",
                        interests: ["Art", "Music", "Books"],
                        gradient: "from-accent/80 to-primary/80",
                        zIndex: 1
                      }
                    ].map((profile, index) => (
                      <div
                        key={profile.id}
                        className={`absolute inset-0 cursor-grab active:cursor-grabbing transform-gpu transition-all duration-300 hover:scale-[1.02]`}
                        style={{ 
                          zIndex: profile.zIndex,
                          transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`
                        }}
                      >
                        <div className={`w-full h-full bg-gradient-to-br ${profile.gradient} rounded-3xl overflow-hidden shadow-elegant border border-border/50 backdrop-blur-sm animate-fade-in`}>
                          {/* Profile Image Area */}
                          <div className="h-2/3 relative bg-background/20 flex items-center justify-center">
                            <div className="text-8xl">{profile.image}</div>
                            
                            {/* Distance Badge */}
                            <div className="absolute top-4 right-4 bg-background/70 backdrop-blur-sm rounded-full px-3 py-1">
                              <span className="text-foreground text-xs font-medium">📍 {profile.distance}</span>
                            </div>
                          </div>

                          {/* Profile Info */}
                          <div className="h-1/3 p-6 bg-background/30 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="text-2xl font-display font-bold text-foreground">{profile.name}, {profile.age}</h3>
                              </div>
                              <div className="w-6 h-6 bg-primary rounded-full"></div>
                            </div>
                            
                            <p className="text-foreground/90 font-professional text-sm mb-3 line-clamp-2">{profile.bio}</p>
                            
                            {Array.isArray(profile.interests) && profile.interests.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {profile.interests.map((interest, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-card/50 rounded-full text-foreground font-professional text-xs font-medium">
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Swipe Actions */}
                  <div className="flex justify-center items-center space-x-6 mt-8">
                    <button className="w-16 h-16 bg-gradient-to-r from-destructive to-destructive/80 rounded-full flex items-center justify-center shadow-elegant hover:scale-110 transition-all duration-300 hover:shadow-glow">
                      <span className="text-destructive-foreground text-2xl">❌</span>
                    </button>
                    
                    <button className="w-12 h-12 bg-gradient-to-r from-secondary to-secondary/80 rounded-full flex items-center justify-center shadow-elegant hover:scale-110 transition-all duration-300 hover:shadow-glow">
                      <Star className="w-6 h-6 text-secondary-foreground" />
                    </button>
                    
                    <button className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-elegant hover:scale-110 transition-all duration-300 hover:shadow-glow">
                      <Heart className="w-8 h-8 text-primary-foreground" fill="currentColor" />
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="text-center bg-card/50 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="text-2xl font-display font-bold text-foreground">47</div>
                      <div className="text-muted-foreground font-professional text-sm">Likes Today</div>
                    </div>
                    <div className="text-center bg-card/50 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="text-2xl font-display font-bold text-foreground">12</div>
                      <div className="text-muted-foreground font-professional text-sm">Matches</div>
                    </div>
                    <div className="text-center bg-card/50 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="text-2xl font-display font-bold text-foreground">3</div>
                      <div className="text-muted-foreground font-professional text-sm">Super Likes</div>
                    </div>
                  </div>

                  {/* Compact Horizontal Subscription Plans */}
                  <div className="mt-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-display font-bold text-foreground mb-2">Upgrade Your Experience ✨</h3>
                      <p className="text-muted-foreground text-sm font-professional">Choose your dating superpower</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 sm:overflow-x-auto pb-4 scrollbar-hide">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`w-full sm:flex-shrink-0 sm:w-56 md:w-64 border border-border/50 shadow-elegant rounded-2xl bg-card/80 backdrop-blur-md animate-fade-in hover:scale-105 transition-all duration-300 hover:shadow-glow`}
                          style={{ animationDelay: `${plan.id * 0.1}s` }}
                        >
                          <div className="p-5">
                            <div className="text-center mb-4">
                              <h4 className="text-lg font-display font-bold text-foreground">{plan.name}</h4>
                              <p className="text-xl font-professional font-semibold text-primary">{plan.price}</p>
                            </div>

                            <ul className="space-y-2 mb-4 text-sm font-professional text-muted-foreground">
                              {plan.features.slice(0, 3).map((f, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary text-xs mt-1 flex-shrink-0">✓</span>
                                  <span className="leading-tight">{f}</span>
                                </li>
                              ))}
                              {plan.features.length > 3 && (
                                <li className="text-muted-foreground/70 text-xs font-professional">+{plan.features.length - 3} more features</li>
                              )}
                            </ul>

                            <Button
                              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 font-professional font-semibold text-sm sm:text-base py-2.5 rounded-xl"
                              onClick={() => alert(`Subscribed to ${plan.name}`)}
                            >
                              Choose Plan
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "pairing":
        return (
          <div className="flex-1 overflow-y-auto min-h-screen scroll-smooth relative">
            {/* GenZ Header for Pairing */}
            <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b border-border">
              <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Smart Pairing ✨
                </h1>
                <span className="text-sm text-muted-foreground font-professional font-medium">AI Matches 🧠</span>
              </div>
            </header>

            <div className="relative z-10 p-4">
              <PairingMatches />
            </div>
          </div>
        );

      case "swipe":
        return (
          <div className="flex-1 overflow-y-auto min-h-screen bg-background">
            <SwipeCards />
          </div>
        );

      case "matches":
        return (
          <div className="flex-1 overflow-y-auto min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-4">
              <h2 className="text-2xl font-display font-bold text-center mb-6 bg-gradient-primary bg-clip-text text-transparent">
                Your Matches ✨
              </h2>
              <div className="text-center text-muted-foreground font-professional">
                <p>Matches feature coming soon! 💕</p>
                <p className="mt-2 text-sm">Keep swiping to find your perfect match</p>
              </div>
            </div>
          </div>
        );

      case "pairing":
        return (
          <div className="flex-1 overflow-y-auto min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-4">
              <h2 className="text-2xl font-display font-bold text-center mb-6 bg-gradient-primary bg-clip-text text-transparent">
                AI Pairing ✨
              </h2>
              <div className="text-center text-muted-foreground font-professional">
                <p>AI Pairing feature coming soon! 🤖</p>
                <p className="mt-2 text-sm">Our AI will find your perfect matches</p>
              </div>
            </div>
          </div>
        );

      case "chat":
        return (
          <div className="flex-1 overflow-y-auto min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-4">
              <h2 className="text-2xl font-display font-bold text-center mb-6 bg-gradient-primary bg-clip-text text-transparent">
                Messages ✨
              </h2>
              <div className="text-center text-muted-foreground font-professional">
                <p>Chat feature coming soon! 💬</p>
                <p className="mt-2 text-sm">Start swiping to get matches</p>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="flex-1 overflow-y-auto min-h-screen bg-background">
            <EnhancedProfileDisplay />
          </div>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground font-professional">Page not found</p>
          </div>
        );
    }
  };

  return (
    <div className="genZ-app-container pwa-ready smooth-scroll safe-area-top safe-area-bottom">
      <div className="min-h-screen flex flex-col">
        {/* Main Content */}
        <main className="flex-1 relative">
          {renderContent()}
        </main>

        {/* Bottom Navigation handled globally by UnifiedLayout */}
        <div className="hidden">
          <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
            {[
              { 
                path: "/swipe", 
                icon: Home, 
                label: "Home", 
                isActive: activeTab === 'home' || activeTab === 'swipe',
                gradient: "from-primary to-primary-glow"
              },
              { 
                path: "/matches", 
                icon: Heart, 
                label: "Matches", 
                isActive: activeTab === 'matches',
                gradient: "from-secondary to-secondary-glow" 
              },
              { 
                path: "/feed", 
                icon: Users, 
                label: "Feed", 
                isActive: activeTab === 'feed',
                gradient: "from-purple-500 to-pink-500"
              },
              { 
                path: "/pairing", 
                icon: Brain, 
                label: "Pairing", 
                isActive: activeTab === 'pairing',
                gradient: "from-accent to-accent-glow"
              },
              { 
                path: "/chat", 
                icon: MessageCircle, 
                label: "Messages", 
                isActive: activeTab === 'chat',
                gradient: "from-primary to-secondary"
              },
              { 
                path: "/profile", 
                icon: User, 
                label: "Profile", 
                isActive: activeTab === 'profile',
                gradient: "from-secondary to-accent"
              }
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`genZ-nav-item touch-feedback flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[60px] ${
                  item.isActive 
                    ? `bg-gradient-to-r ${item.gradient} text-primary-foreground shadow-glow transform scale-110` 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon className={`w-5 h-5 mb-1 ${item.isActive ? 'text-primary' : ''}`} />
                <span className={`text-xs font-professional font-medium ${item.isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InstagramUI;