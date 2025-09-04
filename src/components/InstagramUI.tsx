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
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-background">
            {/* Clean Hero Section - Professional Layout */}
            <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
              <div className="container mx-auto px-6 py-20 text-center">
                <div className="max-w-3xl mx-auto animate-fade-in">
                  <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                    Find Your<br/>
                    <span className="bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
                      Perfect Match
                    </span>
                  </h1>
                  <p className="text-xl font-medium mb-10 opacity-95 max-w-2xl mx-auto">
                    No endless swiping. Just 10 perfect matches daily.
                  </p>
                  
                  <Button className="bg-white text-violet-600 hover:bg-gray-50 text-lg font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 mb-16">
                    Start Finding Love 💜
                  </Button>
                </div>
              </div>
              
              {/* Professional Stats Bar */}
              <div className="border-t border-white/20 bg-white/10 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-6">
                  <div className="flex justify-center items-center space-x-12 text-center">
                    <div>
                      <div className="text-2xl font-bold">50K+</div>
                      <div className="text-sm opacity-80">Active Users</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">10K+</div>
                      <div className="text-sm opacity-80">Matches Made</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">4.9⭐</div>
                      <div className="text-sm opacity-80">App Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why DatingSigma - Professional Card Layout */}
            <div className="container mx-auto px-6 py-20">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Why DatingSigma?</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">The smarter way to find love</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                {[
                  { 
                    icon: "🧠", 
                    title: "AI-Powered Matching", 
                    desc: "Our algorithm learns your preferences and finds your ideal match based on 200+ compatibility factors"
                  },
                  { 
                    icon: "⚡", 
                    title: "Instant Chemistry Detection", 
                    desc: "Skip the small talk. Our compatibility score shows instant chemistry potential before you even match"
                  },
                  { 
                    icon: "🎯", 
                    title: "Quality Over Quantity", 
                    desc: "Only 10 curated matches daily means every profile you see has serious potential"
                  },
                  { 
                    icon: "🔒", 
                    title: "Verified Profiles Only", 
                    desc: "ID verification ensures you're talking to real people, not fake profiles or bots"
                  }
                ].map((feature, index) => (
                  <div 
                    key={feature.title}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Professional Subscription Section */}
              <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Choose Your Journey</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">Unlock your dating potential</p>
              </div>
              
              <div className="max-w-4xl mx-auto space-y-6">
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 ${
                      index === 1 ? 'ring-2 ring-violet-500 scale-105' : ''
                    } animate-scale-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Popular Badge */}
                    {index === 1 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                          ⭐ MOST POPULAR
                        </div>
                      </div>
                    )}
                    
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                          <div className="text-3xl font-black text-violet-600">{plan.price}</div>
                        </div>
                        <div className="text-4xl">
                          {plan.id === 1 && "💜"}
                          {plan.id === 2 && "👑"}
                          {plan.id === 3 && "💎"}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-3">
                            <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className={`w-full md:w-auto px-8 py-3 font-bold rounded-xl transition-all duration-300 ${
                          index === 1 
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl' 
                            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-md hover:shadow-lg'
                        }`}
                        onClick={() => alert(`Welcome to ${plan.name}! 💜`)}
                      >
                        {index === 1 ? 'Get Premium' : `Choose ${plan.name}`}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Success Stories - Clean Layout */}
              <div className="mt-24 mb-20">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Real Success Stories</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">Love found through DatingSigma</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      quote: "Found my soulmate within 2 weeks! The AI matching is incredible.",
                      author: "Priya & Arjun",
                      match: "96% compatibility"
                    },
                    {
                      quote: "Finally, a dating app that understands what I'm looking for.",
                      author: "Sneha & Raj", 
                      match: "91% compatibility"
                    },
                    {
                      quote: "No more endless swiping. Every match was meaningful.",
                      author: "Ananya & Vikram",
                      match: "94% compatibility"
                    }
                  ].map((story, index) => (
                    <div 
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center animate-scale-in"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      <p className="text-gray-700 dark:text-gray-300 font-medium italic mb-6 text-lg">"{story.quote}"</p>
                      <div className="space-y-2">
                        <div className="font-bold text-gray-900 dark:text-white">{story.author}</div>
                        <div className="inline-block bg-violet-500 text-white px-4 py-1 rounded-full text-sm font-medium">{story.match}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dating Preferences - Professional Grid */}
              <div className="mb-20">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">What's Your Style?</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">Tell us what you're looking for</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { emoji: "💜", title: "Serious Relationship", desc: "Ready for something real", featured: true },
                    { emoji: "🌟", title: "Casual Dating", desc: "Keep it fun & light" },
                    { emoji: "🤝", title: "Friendship First", desc: "Build a foundation" },
                    { emoji: "🎯", title: "Selective Dating", desc: "Quality over quantity" },
                    { emoji: "✨", title: "Open to Everything", desc: "See where it goes" },
                    { emoji: "💫", title: "It's Complicated", desc: "Unique situations" }
                  ].map((style, index) => (
                    <div 
                      key={style.title}
                      className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-lg transition-all duration-300 cursor-pointer animate-scale-in ${
                        style.featured ? 'ring-2 ring-violet-500 scale-105' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-4xl mb-4">{style.emoji}</div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{style.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{style.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final CTA - Clean Design */}
              <div className="text-center py-16 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-3xl">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Ready to find your perfect match?</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of singles who found love through our intelligent matching system.
                </p>
                <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  Start Your Love Story ✨
                </Button>
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
