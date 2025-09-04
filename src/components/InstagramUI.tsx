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

            {/* Enhanced Mobile Card Stack - Gen Z Pink Vibes */}
            <div className="px-6 py-12 space-y-8 max-w-md mx-auto relative">
              {/* Gen Z Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-xl"></div>
              <div className="absolute top-4 right-4 w-20 h-20 bg-pink-400/10 rounded-full blur-md animate-pulse"></div>
              <div className="absolute bottom-8 left-8 w-16 h-16 bg-purple-400/10 rounded-full blur-lg animate-bounce delay-1000"></div>
              
              <div className="text-center mb-12 relative z-10">
                <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-200 bg-clip-text text-transparent">
                  ✨ Why Choose Us? ✨
                </h2>
                <p className="text-gray-300 text-lg font-medium">Experience the future of dating 💕</p>
              </div>
              
              {[
                { 
                  title: "Smart AI Matching", 
                  desc: "Advanced algorithms find your perfect compatibility",
                  icon: "🧠",
                  gradient: "from-pink-600/30 to-purple-600/30",
                  borderGradient: "from-pink-500/50 to-purple-500/50"
                },
                { 
                  title: "Quality Over Quantity", 
                  desc: "10 curated matches daily, no endless scrolling",
                  icon: "✨",
                  gradient: "from-purple-600/30 to-pink-600/30",
                  borderGradient: "from-purple-500/50 to-pink-500/50"
                },
                { 
                  title: "Verified Profiles", 
                  desc: "Real people, authentic connections only",
                  icon: "🔐",
                  gradient: "from-pink-500/30 to-purple-500/30",
                  borderGradient: "from-pink-400/50 to-purple-400/50"
                }
              ].map((feature, index) => (
                <div 
                  key={feature.title}
                  className={`relative bg-gradient-to-br ${feature.gradient} backdrop-blur-md rounded-3xl p-6 border border-transparent bg-clip-padding animate-scale-in hover:scale-105 transition-all duration-300`}
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    background: `linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(147, 51, 234, 0.1)), linear-gradient(135deg, ${feature.gradient.replace('from-', '').replace('to-', '').replace('/', ', ')})`
                  }}
                >
                  {/* Pink glow border effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.borderGradient} rounded-3xl opacity-20 blur-sm`}></div>
                  
                  <div className="flex items-start space-x-4 relative z-10">
                    <div className="text-4xl animate-bounce delay-300">{feature.icon}</div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-2 bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent">
                        {feature.title}
                      </h3>
                      <p className="text-gray-200 text-sm leading-relaxed font-medium">{feature.desc}</p>
                    </div>
                  </div>
                  
                  {/* Floating particles */}
                  <div className="absolute top-2 right-2 w-2 h-2 bg-pink-400/50 rounded-full animate-ping"></div>
                  <div className="absolute bottom-3 right-6 w-1 h-1 bg-purple-400/60 rounded-full animate-pulse delay-700"></div>
                </div>
              ))}
            </div>

            {/* Enhanced Mobile Subscription Cards with Better Layout */}
            <div className="px-6 py-16 max-w-md mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">Choose Your Plan</h2>
                <p className="text-gray-400 text-lg">Unlock your dating potential</p>
              </div>
              
              <div className="space-y-6">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-3xl p-8 border border-gray-700/50 shadow-2xl animate-scale-in transition-all duration-300 hover:scale-102 hover:border-pink-500/30 ${
                    index === 1 ? 'ring-2 ring-pink-500/50 scale-105 shadow-pink-500/25' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Popular Badge */}
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                      <div className="text-2xl font-bold text-pink-400">{plan.price}</div>
                    </div>
                    <div className="text-3xl">
                      {plan.id === 1 && "💜"}
                      {plan.id === 2 && "👑"}
                      {plan.id === 3 && "💎"}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className={`w-full py-3 font-bold rounded-2xl transition-all duration-300 ${
                      index === 1 
                        ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                    onClick={() => alert(`Welcome to ${plan.name}! ✨`)}
                  >
                    Get {plan.name}
                  </button>
                </div>
                ))}
              </div>
            </div>

            {/* Enhanced Success Stories with Better Layout */}
            <div className="px-6 py-16 max-w-md mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">Success Stories</h2>
                <p className="text-gray-400 text-lg">Real love, real results</p>
              </div>
              
              <div className="space-y-6">
                {[
                  {
                    quote: "Found my soulmate in just 2 weeks!",
                    author: "Emma & Jake",
                    match: "98%"
                  },
                  {
                    quote: "Finally, quality over quantity.",
                    author: "Sarah & Alex", 
                    match: "94%"
                  },
                  {
                    quote: "The AI really understands me.",
                    author: "Maya & Chris",
                    match: "96%"
                  }
                ].map((story, index) => (
                  <div 
                    key={index}
                    className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-6 border border-white/10 animate-scale-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <p className="text-gray-200 italic mb-4">"{story.quote}"</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{story.author}</span>
                      <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {story.match} match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Dating Preferences with Modern Layout */}
            <div className="px-6 py-16 max-w-md mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">Your Style</h2>
                <p className="text-gray-400 text-lg">What are you looking for?</p>
              </div>
              
              {/* Featured - Serious Relationship */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-pink-600/30 to-purple-600/30 backdrop-blur-sm rounded-3xl p-8 border-2 border-pink-500/50 text-center hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="text-5xl mb-4">💜</div>
                  <h3 className="text-2xl font-black text-white mb-2">Serious Relationship</h3>
                  <p className="text-gray-300">Ready for something real</p>
                </div>
              </div>
              
              {/* Other Options */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { emoji: "✨", title: "Casual", desc: "Keep it light" },
                  { emoji: "🌙", title: "Slow Burn", desc: "Take time" },
                  { emoji: "🎭", title: "Complex", desc: "It's complicated" },
                  { emoji: "🎯", title: "Selective", desc: "Quality first" }
                ].map((style, index) => (
                  <div 
                    key={style.title}
                    className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-700 text-center hover:border-gray-600 transition-all duration-300 cursor-pointer animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-3xl mb-2">{style.emoji}</div>
                    <h3 className="font-bold text-white text-sm mb-1">{style.title}</h3>
                    <p className="text-gray-400 text-xs">{style.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Final CTA with Premium Layout */}
            <div className="px-6 py-20 max-w-md mx-auto text-center">
              <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-3xl p-10 border border-gray-700/50 shadow-2xl">
                <h2 className="text-4xl font-black mb-6 bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">Ready to Start?</h2>
                <p className="text-gray-300 mb-10 leading-relaxed text-lg">
                  Join thousands finding meaningful connections through intelligent matching.
                </p>
                <button className="w-full bg-gradient-to-r from-pink-600 to-purple-700 text-white font-bold py-5 rounded-full text-xl hover:from-pink-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-pink-500/25">
                  Begin Your Journey ✨
                </button>
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
      <div className="sticky bottom-0 bg-transparent">
        <div className="flex items-center justify-around py-4">
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
              className={`flex-col space-y-1 h-auto py-3 px-4 relative rounded-full border-2 border-black ${
                activeTab === tab.id ? `${tab.color} bg-white/20` : "text-gray-600"
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
