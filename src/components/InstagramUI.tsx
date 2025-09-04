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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useProfilesFeed } from "@/hooks/useProfilesFeed";
import { usePairing } from "@/hooks/usePairing";
import IDVerificationUpload from "@/components/verification/IDVerificationUpload";
import QCSDisplay from "@/components/scoring/QCSDisplay";
import UserSelector from "@/components/debug/UserSelector";
import SwipeCards from "@/components/swipe/SwipeCards";
import PairingMatches from "@/components/pairing/PairingMatches";
import GhostBenchBar from "@/components/ui/ghost-bench-bar";

interface InstagramUIProps {
  onNavigate: (view: string) => void;
}

const InstagramUI = ({ onNavigate }: InstagramUIProps) => {
  const [activeTab, setActiveTab] = useState<
    "home" | "swipe" | "pairing" | "blinddate" | "profile"
  >("home");

  // ✅ Profiles feed from Supabase (for Swipe tab)
  const { profiles = [], loading, setProfiles } = useProfilesFeed();

  // ✅ Paired profiles (for Pairing tab)
  const { pairedProfiles = [], loading: pairingLoading } = usePairing();

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
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-accent/5">
            {/* Dynamic Hero Section */}
            <div className="relative min-h-[40vh] bg-gradient-to-br from-primary via-secondary to-accent text-white overflow-hidden">
              {/* Floating Background Elements */}
              <div className="absolute inset-0">
                <div className="absolute top-10 left-4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-20 right-6 w-24 h-24 bg-white/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-10 left-1/2 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              {/* Hero Content */}
              <div className="relative z-10 p-6 pt-16">
                <div className="text-center animate-fade-in">
                  <div className="mb-4">
                    <div className="text-6xl mb-2 animate-scale-in">👋</div>
                    <h1 className="text-4xl font-black mb-2 leading-tight">
                      Hey Beautiful!
                    </h1>
                    <p className="text-xl opacity-90 font-medium">Ready to find your vibe?</p>
                  </div>
                </div>
                
                {/* Floating Quote Card */}
                <div className="mt-8 relative animate-scale-in" style={{animationDelay: '0.3s'}}>
                  <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30">
                    <div className="text-center">
                      <div className="text-3xl mb-3">✨</div>
                      <p className="text-lg font-semibold italic">
                        "Skip the endless swipes.<br/>Find your people, your way."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 space-y-8 -mt-6 relative z-20">
              {/* Modes Section - Asymmetric Layout */}
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">Your Vibe Check</h2>
                  <p className="text-muted-foreground">How are you feeling today?</p>
                </div>
                
                {/* Creative Mode Layout */}
                <div className="space-y-4">
                  {/* Top Row - Large Card */}
                  <div className="animate-scale-in">
                    <div className="relative h-32 bg-gradient-to-br from-red-500/20 via-pink-500/20 to-rose-500/20 backdrop-blur-sm rounded-3xl border border-red-500/30 shadow-xl overflow-hidden hover:scale-105 transition-all duration-500 cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                      <div className="relative h-full flex items-center justify-between p-6">
                        <div>
                          <div className="text-4xl mb-1">❤️</div>
                          <h3 className="text-xl font-bold text-red-500">Relationship</h3>
                          <p className="text-sm text-red-400">Looking for the one</p>
                        </div>
                        <div className="text-6xl opacity-20">💕</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Middle Row - Two Medium Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="animate-scale-in" style={{animationDelay: '0.1s'}}>
                      <div className="relative h-28 bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl border border-orange-500/30 shadow-lg overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer">
                        <div className="relative h-full flex flex-col justify-center items-center p-4">
                          <div className="text-3xl mb-1">🔥</div>
                          <h3 className="font-bold text-orange-500">Casual</h3>
                          <p className="text-xs text-orange-400 text-center">Keep it fun</p>
                        </div>
                      </div>
                    </div>
                    <div className="animate-scale-in" style={{animationDelay: '0.2s'}}>
                      <div className="relative h-28 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl border border-blue-500/30 shadow-lg overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer">
                        <div className="relative h-full flex flex-col justify-center items-center p-4">
                          <div className="text-3xl mb-1">🕒</div>
                          <h3 className="font-bold text-blue-500">Benching</h3>
                          <p className="text-xs text-blue-400 text-center">Take it slow</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Row - Unique Shape */}
                  <div className="animate-scale-in" style={{animationDelay: '0.3s'}}>
                    <div className="relative h-24 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 backdrop-blur-sm rounded-full border border-purple-500/30 shadow-xl overflow-hidden hover:scale-105 transition-all duration-500 cursor-pointer">
                      <div className="relative h-full flex items-center justify-center">
                        <div className="text-3xl mr-3">💫</div>
                        <div>
                          <h3 className="font-bold text-purple-500">Situationship</h3>
                          <p className="text-xs text-purple-400">It's complicated</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Stats Dashboard */}
              <div className="relative">
                <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-xl rounded-3xl p-6 border border-primary/20 shadow-2xl animate-scale-in">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      Today's Magic ✨
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { number: "10", label: "Potential Matches", icon: "💕", color: "from-red-500 to-pink-500", delay: "0s" },
                      { number: "3", label: "Active Chats", icon: "💬", color: "from-blue-500 to-cyan-500", delay: "0.1s" },
                      { number: "5", label: "Profile Views", icon: "👀", color: "from-purple-500 to-indigo-500", delay: "0.2s" }
                    ].map((stat, index) => (
                      <div 
                        key={index} 
                        className="text-center group cursor-pointer animate-scale-in hover:scale-110 transition-all duration-300"
                        style={{animationDelay: stat.delay}}
                      >
                        <div className={`relative w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                          <div className="text-xl group-hover:animate-pulse">{stat.icon}</div>
                          <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="text-3xl font-black text-primary group-hover:text-secondary transition-colors">
                          {stat.number}
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Match Flow - Card Stack Design */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-center mb-6">How It Works</h2>
                <div className="relative">
                  {[
                    { emoji: "🎯", text: "AI matches based on your preferences", color: "from-green-500/15 to-emerald-500/15", size: "h-20", offset: "ml-0" },
                    { emoji: "💌", text: "10 curated matches daily", color: "from-pink-500/15 to-rose-500/15", size: "h-18", offset: "ml-4" },
                    { emoji: "💬", text: "Instant chat for high compatibility", color: "from-blue-500/15 to-cyan-500/15", size: "h-16", offset: "ml-8" }
                  ].map((item, index) => (
                    <div 
                      key={index}
                      className={`relative ${item.offset} ${item.size} bg-gradient-to-r ${item.color} backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-scale-in mb-3`}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className="flex items-center space-x-4 h-full">
                        <div className="text-3xl animate-pulse">{item.emoji}</div>
                        <p className="font-semibold">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Subscription Cards - Story Style */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">Level Up Your Game</h2>
                  <p className="text-muted-foreground">Choose your power level</p>
                </div>
                
                <div className="space-y-6">
                  {plans.map((plan, index) => (
                    <div
                      key={plan.id}
                      className={`relative overflow-hidden ${index === 1 ? 'scale-105 ring-2 ring-primary' : ''} animate-scale-in`}
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      {/* Popular Badge for Premium */}
                      {index === 1 && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                            ⭐ MOST POPULAR
                          </div>
                        </div>
                      )}
                      
                      <div className={`relative h-48 bg-gradient-to-br ${
                        index === 0 ? 'from-blue-500/20 to-indigo-500/20' :
                        index === 1 ? 'from-purple-500/20 to-pink-500/20' :
                        'from-yellow-500/20 to-orange-500/20'
                      } backdrop-blur-sm rounded-3xl border-2 ${plan.color} shadow-2xl overflow-hidden hover:scale-105 transition-all duration-500 cursor-pointer`}>
                        
                        {/* Background Pattern */}
                        <div className="absolute inset-0">
                          <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                          <div className="absolute bottom-4 left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                        </div>
                        
                        <div className="relative h-full p-6 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-2xl font-black">{plan.name}</h3>
                              <p className="text-3xl font-black text-primary">{plan.price}</p>
                            </div>
                            <div className="text-5xl">
                              {plan.id === 1 && "🌟"}
                              {plan.id === 2 && "💎"}
                              {plan.id === 3 && "👑"}
                            </div>
                          </div>

                          <div className="flex-1 mb-4">
                            <div className="grid grid-cols-2 gap-2">
                              {plan.features.slice(0, 4).map((feature, idx) => (
                                <div key={idx} className="flex items-center space-x-1">
                                  <span className="text-green-500 text-sm">✅</span>
                                  <span className="text-xs font-medium">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Button
                            className={`w-full font-bold ${plan.buttonColor} shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-12 text-lg`}
                            onClick={() => alert(`Welcome to ${plan.name}! 🎉`)}
                          >
                            Get {plan.name} ✨
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="text-center py-8 animate-fade-in">
                <div className="bg-gradient-primary/10 backdrop-blur-sm rounded-full p-4 inline-block">
                  <p className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Ready to find your perfect match? 💕
                  </p>
                </div>
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
                <h2 className="text-2xl font-bold mb-2">Profile & Testing</h2>
                <p className="text-muted-foreground">Manage your profile and test app features</p>
              </div>
              
              {/* User Selector for Testing */}
              <UserSelector />
              
              {/* QCS Score Display */}
              <QCSDisplay showCalculateButton={true} />
              
              {/* ID Verification */}
              <IDVerificationUpload />
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
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            DatingSigma
          </h1>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("chat")}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="flex items-center justify-around py-2">
          {[
            { id: "home", icon: Home, label: "Home", color: "text-blue-500" },
            { id: "swipe", icon: Heart, label: "Swipe", color: "text-red-500" },
            {
              id: "pairing",
              icon: Zap,
              label: "Pairing",
              color: "text-purple-500",
            },
            {
              id: "blinddate",
              icon: Coffee,
              label: "Blind Date",
              color: "text-orange-500",
            },
            {
              id: "profile",
              icon: User,
              label: "Profile",
              color: "text-green-500",
            },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={`flex-col space-y-1 h-auto py-2 relative ${
                activeTab === tab.id ? `${tab.color}` : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"></div>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstagramUI;
