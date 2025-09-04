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
    "home" | "pairing" | "blinddate" | "profile"
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
            {/* GenZ Header - Updated for transparent background */}
            <header className="sticky top-0 z-20 backdrop-blur-md bg-black/30 border-b border-white/10">
              <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                  datingSigma
                </h1>
                <span className="text-sm text-white/80 font-medium">GenZ Dating 🔥</span>
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
                        gradient: "from-purple-500/80 to-pink-500/80",
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
                        gradient: "from-blue-500/80 to-cyan-500/80",
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
                        gradient: "from-pink-500/80 to-red-500/80",
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
                        <div className={`w-full h-full bg-gradient-to-br ${profile.gradient} rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm animate-fade-in`}>
                          {/* Profile Image Area */}
                          <div className="h-2/3 relative bg-black/20 flex items-center justify-center">
                            <div className="text-8xl animate-pulse-glow">{profile.image}</div>
                            
                            {/* Distance Badge */}
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                              <span className="text-white text-xs font-medium">📍 {profile.distance}</span>
                            </div>
                          </div>

                          {/* Profile Info */}
                          <div className="h-1/3 p-6 bg-black/30 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="text-2xl font-bold text-white">{profile.name}, {profile.age}</h3>
                              </div>
                              <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse-glow"></div>
                            </div>
                            
                            <p className="text-white/90 text-sm mb-3 line-clamp-2">{profile.bio}</p>
                            
                            <div className="flex gap-2 flex-wrap">
                              {profile.interests.map((interest, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-medium">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Swipe Actions */}
                  <div className="flex justify-center items-center space-x-6 mt-8">
                    <button className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-red-500/30">
                      <span className="text-white text-2xl">❌</span>
                    </button>
                    
                    <button className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-blue-500/30">
                      <Star className="w-6 h-6 text-white" />
                    </button>
                    
                    <button className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-green-500/30">
                      <Heart className="w-8 h-8 text-white" fill="currentColor" />
                    </button>
                  </div>

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
                      <div className="text-2xl font-bold text-white">3</div>
                      <div className="text-white/70 text-sm">Super Likes</div>
                    </div>
                  </div>
                  {/* Compact Horizontal Subscription Plans */}
                  <div className="mt-8">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-white mb-2">Upgrade Your Experience ✨</h3>
                      <p className="text-white/70 text-sm">Choose your dating superpower</p>
                    </div>
                    
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`flex-shrink-0 w-48 border-2 ${plan.color} shadow-lg rounded-2xl bg-black/60 backdrop-blur-sm animate-fade-in hover:scale-105 transition-all duration-300`}
                          style={{ animationDelay: `${plan.id * 0.1}s` }}
                        >
                          <div className="p-4">
                            <div className="text-center mb-3">
                              <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                              <p className="text-xl font-semibold text-white">{plan.price}</p>
                            </div>

                            <ul className="space-y-1 mb-3 text-xs text-gray-300">
                              {plan.features.slice(0, 3).map((f, idx) => (
                                <li key={idx} className="flex items-center">
                                  <span className="text-green-400 mr-1">✓</span>
                                  {f}
                                </li>
                              ))}
                              {plan.features.length > 3 && (
                                <li className="text-gray-400 text-xs">+{plan.features.length - 3} more</li>
                              )}
                            </ul>

                            <button
                              className={`w-full text-white ${plan.buttonColor} py-2 rounded-xl text-sm font-semibold hover:scale-105 transition-all duration-300 shadow-md`}
                              onClick={() => alert(`Subscribed to ${plan.name}`)}
                            >
                              Choose Plan
                            </button>
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
            <header className="sticky top-0 z-20 backdrop-blur-md bg-black/30 border-b border-white/10">
              <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                  Smart Pairing ✨
                </h1>
                <span className="text-sm text-white/80 font-medium">AI Matches 🧠</span>
              </div>
            </header>

            {/* GenZ Background Elements for Pairing */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl animate-pulse-glow delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-bounce-slow delay-500"></div>
              
              {/* Floating emojis */}
              <div className="absolute top-10 left-10 text-4xl opacity-20 animate-float">💜</div>
              <div className="absolute top-40 right-20 text-3xl opacity-30 animate-pulse delay-1000">✨</div>
              <div className="absolute bottom-60 left-20 text-4xl opacity-25 animate-bounce delay-500">🔥</div>
              <div className="absolute top-80 right-1/4 text-2xl opacity-20 animate-spin-slow">💫</div>
            </div>

            <div className="relative z-10 p-4 space-y-4">
              <GhostBenchBar onChatSelected={() => onNavigate('chat')} />
              <PairingMatches />
            </div>
          </div>
        );

      case "blinddate":
        return (
          <div className="flex-1 overflow-y-auto min-h-screen scroll-smooth relative">
            {/* GenZ Header for Blind Date */}
            <header className="sticky top-0 z-20 backdrop-blur-md bg-black/30 border-b border-white/10">
              <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  Blind Date Magic 🎭
                </h1>
                <span className="text-sm text-white/80 font-medium">Mystery Dating ❤️</span>
              </div>
            </header>

            {/* GenZ Background Elements for Blind Date */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-2xl animate-pulse-glow delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-500/10 rounded-full blur-xl animate-bounce-slow delay-500"></div>
              
              {/* Floating emojis */}
              <div className="absolute top-10 left-10 text-5xl opacity-20 animate-float">🎭</div>
              <div className="absolute top-40 right-20 text-4xl opacity-30 animate-pulse delay-1000">💘</div>
              <div className="absolute bottom-60 left-20 text-3xl opacity-25 animate-bounce delay-500">🌹</div>
              <div className="absolute top-80 right-1/4 text-4xl opacity-20 animate-wiggle">❤️</div>
              <div className="absolute bottom-40 left-1/3 text-3xl opacity-25 animate-float delay-2000">✨</div>
            </div>

            <div className="relative z-10 min-h-full flex items-center justify-center p-4">
              <div className="genZ-glass-card genZ-hover-lift text-center p-10 shadow-premium border border-white/20 rounded-3xl max-w-lg">
                <div className="space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                      <Coffee className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 text-2xl animate-bounce-slow">🎭</div>
                  </div>
                  
                  <h2 className="text-4xl font-elegant font-bold text-gradient-royal animate-fade-in">
                    Blind Date Experience
                  </h2>
                  
                  <p className="text-white/80 font-modern text-lg leading-relaxed">
                    Connect with someone special without seeing their profile first. 
                    Let chemistry lead the way! ✨
                  </p>
                  
                  <div className="flex justify-center space-x-2 text-2xl animate-pulse-glow delay-500">
                    <span>💕</span>
                    <span>🌟</span>
                    <span>💫</span>
                  </div>
                  
                  <p className="text-2xl font-bold text-gradient-secondary mb-6 animate-bounce-slow">
                    Coming Soon! 🚀
                  </p>
                  
                  <Button 
                    onClick={() => setActiveTab('home')} 
                    className="bg-gradient-primary hover:shadow-royal transition-luxury font-modern font-bold text-lg h-12 rounded-2xl px-8"
                  >
                    <div className="flex items-center space-x-2">
                      <span>Back to Home</span>
                      <span>🏠</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="flex-1 overflow-y-auto min-h-screen scroll-smooth relative">
            {/* GenZ Header for Profile */}
            <header className="sticky top-0 z-20 backdrop-blur-md bg-black/30 border-b border-white/10">
              <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Your Profile ✨
                </h1>
                <span className="text-sm text-white/80 font-medium">Manage & Edit 🛠️</span>
              </div>
            </header>

            {/* GenZ Background Elements for Profile */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-1/4 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl animate-pulse-glow delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-purple-500/10 rounded-full blur-xl animate-bounce-slow delay-500"></div>
              
              {/* Floating emojis */}
              <div className="absolute top-10 left-10 text-4xl opacity-20 animate-float">👤</div>
              <div className="absolute top-40 right-20 text-3xl opacity-30 animate-pulse delay-1000">⚙️</div>
              <div className="absolute bottom-60 left-20 text-4xl opacity-25 animate-bounce delay-500">✨</div>
              <div className="absolute top-80 right-1/4 text-3xl opacity-20 animate-wiggle">🎯</div>
              <div className="absolute bottom-40 left-1/3 text-2xl opacity-25 animate-float delay-2000">💫</div>
            </div>

            <div className="relative z-10 p-4">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="genZ-glass-card genZ-hover-lift p-8 rounded-3xl border border-white/20 text-center">
                  <div className="space-y-4">
                    <div className="relative">
                      <h2 className="text-3xl font-elegant font-bold text-gradient-royal animate-fade-in">
                        Profile Management
                      </h2>
                      <div className="absolute -top-2 -right-4 text-2xl animate-bounce-slow">👤</div>
                    </div>
                    
                    <p className="text-white/80 font-modern text-lg">
                      View and manage your profile information ✨
                    </p>
                    
                    <div className="flex justify-center space-x-2 text-xl animate-pulse-glow delay-500">
                      <span>⚙️</span>
                      <span>📸</span>
                      <span>✏️</span>
                    </div>
                  </div>
                </div>
                
                {/* User Selector for Testing - Enhanced */}
                <div className="genZ-glass-card p-6 rounded-3xl border border-white/20">
                  <UserSelector />
                </div>
              </div>
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
    <div className="min-h-screen flex flex-col">
      {/* Enhanced GenZ Header */}
      <div className="sticky top-0 z-40 genZ-glass-card border-b border-white/20 shadow-premium">
        <div className="flex items-center justify-between px-6 py-4 backdrop-blur-xl">
          <div className="relative">
            <h1 className="text-2xl font-elegant font-bold text-gradient-royal tracking-tight">
              datingSigma
            </h1>
            <div className="absolute -top-1 -right-2 text-sm animate-bounce-slow">✨</div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("chat")}
              className="bg-black/20 hover:bg-primary/20 text-white/80 hover:text-primary transition-luxury rounded-full shadow-soft border border-white/20"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-black/20 hover:bg-accent/20 text-white/80 hover:text-accent transition-luxury rounded-full shadow-soft border border-white/20"
            >
              <Heart className="w-6 h-6" />
            </Button>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="bg-black/20 hover:bg-red-500/20 text-white/80 hover:text-red-400 transition-luxury border border-white/20 rounded-xl px-4 py-2"
            >
              <span className="text-sm font-medium">Logout</span>
              <span className="ml-1">👋</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Premium Bottom Navigation - Enhanced GenZ */}
      <div className="sticky bottom-0 genZ-glass-card border-t border-white/20 shadow-premium">
        <div className="flex items-center justify-around py-6 px-4">
          {[
            { id: "home", icon: Home, label: "Home", gradient: "from-primary to-primary-glow", emoji: "🏠" },
            {
              id: "pairing",
              icon: Heart,
              label: "Pairing",
              gradient: "from-secondary to-secondary-glow",
              emoji: "💕"
            },
            {
              id: "blinddate",
              icon: Coffee,
              label: "Blind Date",
              gradient: "from-orange-500 to-orange-400",
              emoji: "🎭"
            },
            {
              id: "profile",
              icon: User,
              label: "Profile",
              gradient: "from-primary-variant to-primary",
              emoji: "👤"
            },
          ].map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              className={`flex-col space-y-2 h-auto py-4 px-4 relative bg-transparent border-0 transition-luxury group ${
                activeTab === tab.id 
                  ? "scale-110 -translate-y-3 shadow-glow" 
                  : "hover:scale-105 hover:-translate-y-1 hover:shadow-soft"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <div className={`p-3 rounded-full bg-gradient-to-r ${tab.gradient} ${
                activeTab === tab.id ? 'shadow-premium animate-pulse-glow' : 'group-hover:shadow-royal'
              }`}>
                <tab.icon className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <span className={`text-xs font-modern font-medium ${
                  activeTab === tab.id 
                    ? `bg-gradient-to-r ${tab.gradient} bg-clip-text text-transparent font-semibold` 
                    : 'text-white/70 group-hover:text-white'
                }`}>
                  {tab.label}
                </span>
                <span className="text-xs">{tab.emoji}</span>
              </div>
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
