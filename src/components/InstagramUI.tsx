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
          <div className="flex-1 overflow-y-auto bg-background min-h-screen scroll-smooth relative">
            {/* Revolutionary Hero Section - Dark/Light Split */}
            <div className="relative min-h-screen overflow-hidden">
              {/* Split Background Effect */}
              <div className="absolute inset-0">
                <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-br from-background to-muted"></div>
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-bl from-primary/90 via-primary to-primary-dark"></div>
                <div className="absolute left-1/2 top-0 w-px h-full bg-gradient-to-b from-transparent via-border to-transparent transform -translate-x-1/2"></div>
              </div>
              
              {/* Floating Orbs Animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-16 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-float"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-accent/30 rounded-full blur-xl animate-pulse-glow delay-1000"></div>
                <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-secondary/25 rounded-full blur-lg animate-float delay-2000"></div>
                <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-primary-glow/30 rounded-full blur-md animate-pulse-glow delay-500"></div>
              </div>

              {/* Main Content Container */}
              <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl w-full items-center">
                  
                  {/* Left Side - Light Theme */}
                  <div className="text-center md:text-left animate-elegant-entrance">
                    <div className="mb-8">
                      <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6 animate-bounce-in">
                        ✨ Premium Dating Experience
                      </span>
                      <h1 className="text-5xl md:text-7xl font-elegant font-black leading-none mb-6 tracking-tight">
                        Find Your
                        <br/>
                        <span className="text-gradient-primary animate-shimmer">
                          Soulmate
                        </span>
                      </h1>
                      <p className="text-lg text-muted-foreground font-modern leading-relaxed max-w-lg">
                        Where authentic connections meet intelligent matching. Join the most exclusive dating platform designed for meaningful relationships.
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                      <button className="px-8 py-4 bg-gradient-primary text-white font-bold rounded-full text-lg shadow-premium hover-luxury transition-luxury font-modern">
                        Start Matching
                      </button>
                      <button className="px-8 py-4 border-2 border-primary text-primary font-bold rounded-full text-lg hover:bg-primary hover:text-white transition-luxury font-modern">
                        Learn More
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-center md:justify-start gap-8 text-sm">
                      <div className="text-center animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                        <div className="font-bold text-primary text-2xl">50K+</div>
                        <div className="text-muted-foreground font-modern">Active Users</div>
                      </div>
                      <div className="text-center animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                        <div className="font-bold text-accent text-2xl">15K+</div>
                        <div className="text-muted-foreground font-modern">Success Stories</div>
                      </div>
                      <div className="text-center animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                        <div className="font-bold text-secondary text-2xl">4.9⭐</div>
                        <div className="text-muted-foreground font-modern">App Rating</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Dark Theme with Cards */}
                  <div className="relative animate-slide-up">
                    <div className="relative">
                      {/* Floating Cards Stack */}
                      <div className="relative w-80 h-96 mx-auto">
                        <div className="absolute inset-0 glass-luxury rounded-3xl shadow-premium rotate-6 animate-float opacity-90"></div>
                        <div className="absolute inset-0 glass-dark-luxury rounded-3xl shadow-royal -rotate-3 animate-pulse-glow delay-300"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-elegant border border-white/20 p-8 flex flex-col items-center justify-center text-white">
                          <div className="w-20 h-20 bg-gradient-secondary rounded-full mb-6 flex items-center justify-center animate-pulse-glow">
                            <Heart className="w-10 h-10 text-white" fill="currentColor" />
                          </div>
                          <h3 className="text-2xl font-elegant font-bold mb-4">Perfect Match Awaits</h3>
                          <p className="text-white/80 text-center text-sm font-modern leading-relaxed">
                            Our AI analyzes 200+ compatibility factors to find your ideal partner
                          </p>
                          <div className="flex space-x-2 mt-6">
                            <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse"></div>
                            <div className="w-3 h-3 bg-white/40 rounded-full animate-pulse delay-200"></div>
                            <div className="w-3 h-3 bg-white/20 rounded-full animate-pulse delay-400"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revolutionary Features Section */}
            <div className="relative py-24 bg-gradient-to-br from-muted/50 to-background overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0">
                <div className="absolute top-20 left-1/4 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse-glow delay-1000"></div>
              </div>

              <div className="relative z-10 max-w-6xl mx-auto px-4">
                <div className="text-center mb-16 animate-elegant-entrance">
                  <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                    🚀 Next Generation Features
                  </span>
                  <h2 className="text-4xl md:text-6xl font-elegant font-black mb-6 tracking-tight">
                    Why We're
                    <span className="text-gradient-gold animate-shimmer"> Different</span>
                  </h2>
                  <p className="text-xl text-muted-foreground font-modern max-w-2xl mx-auto">
                    Revolutionary technology meets human connection
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: "🧠",
                      title: "AI-Powered Matching",
                      description: "Advanced neural networks analyze personality, values, and lifestyle for perfect compatibility",
                      gradient: "from-primary to-primary-glow",
                      delay: "0s"
                    },
                    {
                      icon: "🔐",
                      title: "Verified Profiles",
                      description: "Multi-layer verification ensures authentic connections with real people",
                      gradient: "from-accent to-accent-glow", 
                      delay: "0.2s"
                    },
                    {
                      icon: "💎",
                      title: "Premium Experience",
                      description: "Curated matches, priority support, and exclusive events for members",
                      gradient: "from-secondary to-secondary-glow",
                      delay: "0.4s"
                    }
                  ].map((feature, index) => (
                    <div 
                      key={index} 
                      className="group relative animate-bounce-in" 
                      style={{ animationDelay: feature.delay }}
                    >
                      <div className="relative glass-luxury rounded-3xl p-8 border-gradient shadow-premium hover-elegant transition-luxury h-full">
                        <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-6 flex items-center justify-center text-2xl animate-pulse-glow group-hover:scale-110 transition-luxury`}>
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-elegant font-bold mb-4 text-foreground group-hover:text-gradient-primary transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground font-modern leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Preferences Section */}
            <div className="relative py-24 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary))_1px,transparent_1px)] bg-[length:50px_50px]"></div>
              </div>

              <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                <div className="mb-16 animate-elegant-entrance">
                  <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
                    💫 Personalize Your Journey  
                  </span>
                  <h2 className="text-4xl md:text-6xl font-elegant font-black mb-6 tracking-tight">
                    What Are You
                    <span className="text-gradient-royal animate-shimmer"> Looking For?</span>
                  </h2>
                  <p className="text-xl text-muted-foreground font-modern max-w-2xl mx-auto">
                    Choose your path to meaningful connections
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {[
                    { emoji: "💕", text: "Serious Relationship", desc: "Ready for something meaningful and long-term", primary: true },
                    { emoji: "✨", text: "Casual Dating", desc: "Exploring connections with an open mind" },
                    { emoji: "🌙", text: "Take It Slow", desc: "Building friendships that could grow into more" },
                    { emoji: "🎭", text: "It's Complicated", desc: "Open to various types of connections" }
                  ].map((option, index) => (
                    <div 
                      key={index}
                      className={`group cursor-pointer animate-bounce-in ${
                        option.primary 
                          ? 'glass-luxury border-gradient shadow-premium' 
                          : 'glass-dark-luxury border border-border/50 hover:border-primary/30'
                      } rounded-2xl p-6 hover-elegant transition-luxury`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-3xl mb-3 animate-pulse-glow">{option.emoji}</div>
                      <h3 className={`text-lg font-elegant font-bold mb-2 ${
                        option.primary ? 'text-gradient-primary' : 'text-foreground group-hover:text-primary'
                      } transition-colors`}>
                        {option.text}
                      </h3>
                      <p className="text-sm text-muted-foreground font-modern">
                        {option.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 animate-slide-up">
                  <button className="px-12 py-4 bg-gradient-primary text-white font-bold rounded-full text-lg shadow-premium hover-luxury transition-luxury font-modern">
                    Start Your Journey Now
                  </button>
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
