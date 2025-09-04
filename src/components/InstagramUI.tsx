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

  // ✅ Profiles feed from Supabase (only for Swipe tab)
  const { profiles = [], loading, setProfiles } = useProfilesFeed();

  // ✅ Paired profiles (only for Pairing tab)
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
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-pink-900 via-black to-purple-900 text-white min-h-screen scroll-smooth relative">
            {/* Gen Z Pink Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-10 left-10 w-40 h-40 bg-pink-400/20 rounded-full blur-2xl animate-bounce"></div>
              <div className="absolute top-1/3 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
              <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-pink-300/20 rounded-full blur-lg animate-bounce delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-300/20 rounded-full blur-md animate-pulse delay-500"></div>
            </div>
            
            {/* Enhanced Mobile-First Hero with Better Layout */}
            <div className="relative min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-pink-800 flex flex-col justify-center items-center px-4 overflow-hidden">
              {/* Gen Z Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl animate-bounce"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-300"></div>
              <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-r from-pink-300/20 to-purple-300/20 rounded-full blur-lg animate-bounce delay-500"></div>
              {/* Background Card Effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-80 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl opacity-20 rotate-12"></div>
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-72 h-96 bg-gradient-to-b from-gray-700 to-gray-900 rounded-3xl opacity-30 -rotate-6"></div>
              </div>
              
              <div className="relative z-10 text-center max-w-sm mx-auto">
                <div className="mb-8">
                  <h1 className="text-6xl font-black leading-tight mb-6">
                    Find Your<br/>
                    <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                      Match
                    </span>
                  </h1>
                  <p className="text-gray-300 text-lg font-light leading-relaxed">
                    Quality connections.<br/>Zero endless swiping.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <button className="w-full bg-white text-black font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-all duration-300">
                    Start Matching
                  </button>
                  <div className="flex justify-center space-x-8 text-sm text-gray-400">
                    <div className="text-center">
                      <div className="font-bold text-white">50K+</div>
                      <div>Members</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">15K+</div>
                      <div>Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">4.9⭐</div>
                      <div>Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Us - Matching Hero Style */}
            <div className="relative min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-pink-800 flex flex-col justify-center items-center px-4 overflow-hidden">
              {/* Gen Z Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl animate-bounce"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-300"></div>
              <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-r from-pink-300/20 to-purple-300/20 rounded-full blur-lg animate-bounce delay-500"></div>
              
              <div className="relative z-10 text-center max-w-sm mx-auto">
                <div className="mb-8">
                  <h1 className="text-6xl font-black leading-tight mb-6">
                    ✨ Why Choose<br/>
                    <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                      Us?
                    </span>
                  </h1>
                  <p className="text-gray-300 text-lg font-light leading-relaxed">
                    Experience the future of dating 💕
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <div className="text-3xl mb-2">🧠</div>
                      <h3 className="text-lg font-bold text-white mb-1">Smart AI Matching</h3>
                      <p className="text-gray-300 text-sm">Advanced algorithms find your perfect compatibility</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <div className="text-3xl mb-2">✨</div>
                      <h3 className="text-lg font-bold text-white mb-1">Quality Over Quantity</h3>
                      <p className="text-gray-300 text-sm">10 curated matches daily, no endless scrolling</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <div className="text-3xl mb-2">🔐</div>
                      <h3 className="text-lg font-bold text-white mb-1">Verified Profiles</h3>
                      <p className="text-gray-300 text-sm">Real people, authentic connections only</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Style - Matching Hero Style */}
            <div className="relative min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-pink-800 flex flex-col justify-center items-center px-4 overflow-hidden">
              {/* Gen Z Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
              <div className="absolute top-1/4 right-1/4 w-28 h-28 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl animate-bounce delay-200"></div>
              <div className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-700"></div>
              
              <div className="relative z-10 text-center max-w-sm mx-auto">
                <div className="mb-8">
                  <h1 className="text-6xl font-black leading-tight mb-6">
                    Your<br/>
                    <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                      Style
                    </span>
                  </h1>
                  <p className="text-gray-300 text-lg font-light leading-relaxed">
                    What are you looking for?
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <p className="text-lg font-bold text-white">💜 Serious Relationship</p>
                    <p className="text-gray-300 text-sm">Ready for something real</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                    <p className="text-base text-gray-300">✨ Casual - Keep it light</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                    <p className="text-base text-gray-300">🌙 Slow Burn - Take your time</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                    <p className="text-base text-gray-300">🎭 Complex - It's complicated</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                    <p className="text-base text-gray-300">🎯 Selective - Quality first</p>
                  </div>
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
        <div className="flex items-center justify-between px-4 py-3 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-lg">
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
      <div className="sticky bottom-0 bg-white/20 backdrop-blur-md border-t border-white/30">
        <div className="flex items-center justify-around py-4 relative" style={{
          clipPath: 'polygon(5% 0%, 95% 0%, 100% 15%, 100% 85%, 95% 100%, 5% 100%, 0% 85%, 0% 15%)'
        }}>
          {[
            { id: "home", icon: Home, label: "Home", color: "text-pink-600" },
            { id: "swipe", icon: Heart, label: "Swipe", color: "text-red-600" },
            {
              id: "pairing",
              icon: Heart,
              label: "Pairing",
              color: "text-yellow-500",
            },
            {
              id: "blinddate",
              icon: Coffee,
              label: "Blind Date",
              color: "text-orange-600",
            },
            {
              id: "profile",
              icon: User,
              label: "Profile",
              color: "text-purple-600",
            },
          ].map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              className={`flex-col space-y-1 h-auto py-3 px-4 relative bg-transparent border-0 outline-none focus:outline-none hover:outline-none active:outline-none transition-all duration-300 ${tab.color} ${
                activeTab === tab.id 
                  ? "scale-110 -translate-y-2 drop-shadow-2xl" 
                  : "hover:scale-105 hover:-translate-y-1 hover:drop-shadow-lg"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="w-6 h-6" fill="currentColor" />
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
