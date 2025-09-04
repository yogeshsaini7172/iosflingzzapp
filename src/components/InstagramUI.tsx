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
          <div className="flex-1 overflow-y-auto">
            {/* Hero Section with Gradient */}
            <div className="bg-gradient-primary text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative p-6 text-center">
                <div className="animate-fade-in">
                  <h1 className="text-3xl font-bold mb-2">👋 Hey there! Welcome</h1>
                  <p className="text-sm opacity-90">Never settle for less than what your heart desires</p>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Highlight Banner with Glass Effect */}
              <div className="relative bg-gradient-subtle backdrop-blur-sm rounded-2xl p-6 text-center border border-primary/20 shadow-xl animate-scale-in">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl"></div>
                <div className="relative">
                  <div className="text-2xl mb-2">✨</div>
                  <p className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    "Skip the endless swipes. Find your people, your way."
                  </p>
                </div>
              </div>

              {/* Your Modes - Premium Cards */}
              <div className="space-y-4 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-1">Your Modes</h2>
                  <p className="text-muted-foreground">Choose how you vibe:</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { emoji: "❤️", title: "Relationship", gradient: "from-red-500/20 to-pink-500/20", color: "text-red-500" },
                    { emoji: "🔥", title: "Casual", gradient: "from-orange-500/20 to-red-500/20", color: "text-orange-500" },
                    { emoji: "🕒", title: "Benching", gradient: "from-blue-500/20 to-purple-500/20", color: "text-blue-500" },
                    { emoji: "💫", title: "Situationship", gradient: "from-purple-500/20 to-pink-500/20", color: "text-purple-500" }
                  ].map((mode, index) => (
                    <div 
                      key={mode.title}
                      className={`relative bg-gradient-to-br ${mode.gradient} backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-scale-in hover-scale`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-3xl mb-2">{mode.emoji}</div>
                      <div className={`font-semibold ${mode.color}`}>{mode.title}</div>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Flow - Interactive Cards */}
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-center">Match Flow</h2>
                <div className="space-y-3">
                  {[
                    { emoji: "🎯", text: "Based on your physical & mental preferences", color: "from-green-500/10 to-emerald-500/10" },
                    { emoji: "💌", text: "Only 10 pairs shown per day", color: "from-pink-500/10 to-rose-500/10" },
                    { emoji: "💬", text: "Send a chat request — or get instant chat if your match score is high", color: "from-blue-500/10 to-cyan-500/10" }
                  ].map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-center space-x-4 bg-gradient-to-r ${item.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-scale-in`}
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      <div className="text-2xl flex-shrink-0 animate-pulse">{item.emoji}</div>
                      <p className="text-sm font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Stats - Glassmorphism */}
              <div className="relative bg-gradient-secondary/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl animate-scale-in">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-2xl"></div>
                <div className="relative">
                  <h3 className="font-bold text-lg mb-4 text-center bg-gradient-primary bg-clip-text text-transparent">
                    Today's Opportunities ✨
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { number: "10", label: "New Matches", color: "text-primary", icon: "💕" },
                      { number: "3", label: "Chat Requests", color: "text-secondary", icon: "💬" },
                      { number: "5", label: "Profile Views", color: "text-accent", icon: "👀" }
                    ].map((stat, index) => (
                      <div key={index} className="text-center group hover:scale-110 transition-transform duration-300">
                        <div className="text-lg mb-1 group-hover:animate-pulse">{stat.icon}</div>
                        <div className={`text-3xl font-bold ${stat.color} group-hover:text-primary transition-colors`}>
                          {stat.number}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subscription Plans - Premium Design */}
              <div className="space-y-4 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-1">Choose Your Plan</h2>
                  <p className="text-muted-foreground">Unlock your dating potential</p>
                </div>
                <div className="grid gap-4">
                  {plans.map((plan, index) => (
                    <div
                      key={plan.id}
                      className={`relative overflow-hidden bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border-2 ${plan.color} shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-scale-in hover-scale`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
                      <div className="relative p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <p className="text-2xl font-bold text-primary">{plan.price}</p>
                          </div>
                          <div className="text-2xl">
                            {plan.id === 1 && "🌟"}
                            {plan.id === 2 && "💎"}
                            {plan.id === 3 && "👑"}
                          </div>
                        </div>

                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center space-x-2 text-sm">
                              <span className="text-green-500">✅</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          className={`w-full text-white font-semibold ${plan.buttonColor} shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl`}
                          onClick={() => alert(`Subscribed to ${plan.name}`)}
                        >
                          Get {plan.name} ✨
                        </Button>
                      </div>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Spacer */}
              <div className="h-4"></div>
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
