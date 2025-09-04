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
          <div className="flex-1 overflow-y-auto bg-black text-white">
            {/* Premium Dark Hero */}
            <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 overflow-hidden">
              {/* Subtle overlay effects */}
              <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10 container mx-auto px-6 py-20 min-h-screen flex flex-col justify-center">
                <div className="text-center max-w-4xl mx-auto animate-fade-in">
                  <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
                    Find Your<br/>
                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Perfect Match
                    </span>
                  </h1>
                  <p className="text-2xl font-light text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                    Experience dating redefined. Our AI connects souls, not just profiles.
                    Quality over quantity. Always.
                  </p>
                  
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white text-xl font-bold px-12 py-5 rounded-full shadow-2xl hover:shadow-violet-500/25 transition-all duration-500 mb-16">
                    Begin Your Journey
                  </Button>
                </div>
                
                {/* Elegant stats */}
                <div className="absolute bottom-10 left-0 right-0">
                  <div className="container mx-auto px-6">
                    <div className="flex justify-center items-center space-x-16 text-center">
                      <div className="group">
                        <div className="text-3xl font-light text-violet-400 group-hover:text-violet-300 transition-colors">50K+</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Members</div>
                      </div>
                      <div className="group">
                        <div className="text-3xl font-light text-purple-400 group-hover:text-purple-300 transition-colors">15K+</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Connections</div>
                      </div>
                      <div className="group">
                        <div className="text-3xl font-light text-pink-400 group-hover:text-pink-300 transition-colors">4.9⭐</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Features Section */}
            <div className="bg-gray-950 py-24">
              <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                  <h2 className="text-5xl font-black mb-6">Experience Excellence</h2>
                  <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Crafted for those who demand more from their dating experience
                  </p>
                </div>
                
                <div className="grid lg:grid-cols-3 gap-8">
                  {[
                    { 
                      icon: "✨", 
                      title: "AI-Powered Intelligence", 
                      desc: "Advanced algorithms that understand your deepest preferences and connect you with truly compatible souls.",
                      gradient: "from-violet-600/20 to-purple-600/20"
                    },
                    { 
                      icon: "💫", 
                      title: "Curated Excellence", 
                      desc: "Hand-selected matches delivered daily. Every profile you see has been chosen specifically for you.",
                      gradient: "from-purple-600/20 to-pink-600/20"
                    },
                    { 
                      icon: "🔐", 
                      title: "Privacy First", 
                      desc: "Your data is sacred. Military-grade encryption ensures your personal information stays personal.",
                      gradient: "from-pink-600/20 to-violet-600/20"
                    }
                  ].map((feature, index) => (
                    <div 
                      key={feature.title}
                      className={`relative bg-gradient-to-br ${feature.gradient} backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 animate-scale-in group`}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                      <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Premium Subscription Plans */}
            <div className="bg-black py-24">
              <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                  <h2 className="text-5xl font-black mb-6">Choose Your Experience</h2>
                  <p className="text-xl text-gray-400">Unlock the full potential of meaningful connections</p>
                </div>
                
                <div className="max-w-5xl mx-auto space-y-6">
                  {plans.map((plan, index) => (
                    <div
                      key={plan.id}
                      className={`relative bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden hover:border-gray-600/50 transition-all duration-500 hover:scale-[1.02] ${
                        index === 1 ? 'ring-2 ring-violet-500/50 scale-105' : ''
                      } animate-scale-in`}
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      {/* Premium indicator */}
                      {index === 1 && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-2 rounded-full text-sm font-bold shadow-xl uppercase tracking-wider">
                            Most Popular
                          </div>
                        </div>
                      )}
                      
                      <div className="p-10">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-3xl font-black text-white mb-2">{plan.name}</h3>
                            <div className="text-4xl font-light">
                              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                {plan.price}
                              </span>
                            </div>
                          </div>
                          <div className="text-6xl opacity-80">
                            {plan.id === 1 && "💜"}
                            {plan.id === 2 && "👑"}
                            {plan.id === 3 && "💎"}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center space-x-3 group">
                              <div className="w-6 h-6 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                              <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          className={`w-full md:w-auto px-10 py-4 font-bold rounded-2xl transition-all duration-500 ${
                            index === 1 
                              ? 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-xl hover:shadow-violet-500/25' 
                              : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl'
                          }`}
                          onClick={() => alert(`Welcome to ${plan.name}! ✨`)}
                        >
                          {index === 1 ? 'Get Premium Access' : `Choose ${plan.name}`}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Success Stories - Elegant testimonials */}
            <div className="bg-gray-950 py-24">
              <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                  <h2 className="text-5xl font-black mb-6">Love Stories</h2>
                  <p className="text-xl text-gray-400">Real connections. Real results.</p>
                </div>
                
                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {[
                    {
                      quote: "The quality of matches was incredible. Found my person within weeks, not months.",
                      author: "Sophia & James",
                      match: "98% compatibility",
                      gradient: "from-violet-600/20 to-purple-600/20"
                    },
                    {
                      quote: "Finally, a platform that values depth over surface. Every conversation mattered.",
                      author: "Maya & Alexander", 
                      match: "94% compatibility",
                      gradient: "from-purple-600/20 to-pink-600/20"
                    },
                    {
                      quote: "The AI understood what I was looking for better than I did. Absolutely transformative.",
                      author: "Isabella & David",
                      match: "96% compatibility",
                      gradient: "from-pink-600/20 to-violet-600/20"
                    }
                  ].map((story, index) => (
                    <div 
                      key={index}
                      className={`relative bg-gradient-to-br ${story.gradient} backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 animate-scale-in`}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className="text-center">
                        <p className="text-gray-200 font-light italic text-lg mb-8 leading-relaxed">"{story.quote}"</p>
                        <div className="space-y-3">
                          <div className="font-bold text-white text-xl">{story.author}</div>
                          <div className="inline-block bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                            {story.match}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dating Preferences - Elegant selection */}
            <div className="bg-black py-24">
              <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                  <h2 className="text-5xl font-black mb-6">Your Dating Style</h2>
                  <p className="text-xl text-gray-400">Tell us what resonates with your heart</p>
                </div>
                
                <div className="max-w-4xl mx-auto">
                  {/* Featured preference */}
                  <div className="mb-8 animate-scale-in">
                    <div className="relative bg-gradient-to-r from-violet-600/30 to-purple-600/30 backdrop-blur-sm rounded-3xl p-12 border-2 border-violet-500/50 text-center hover:scale-105 transition-all duration-500 cursor-pointer group">
                      <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">💜</div>
                      <h3 className="text-3xl font-black text-white mb-4">Serious Relationship</h3>
                      <p className="text-xl text-gray-300 font-light">Ready to find your person and build something beautiful together</p>
                    </div>
                  </div>
                  
                  {/* Other preferences */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { emoji: "✨", title: "Casual Connection", desc: "Exploring with an open heart" },
                      { emoji: "🌙", title: "Taking It Slow", desc: "Building trust naturally" },
                      { emoji: "🎭", title: "It's Complicated", desc: "Unique situations welcome" },
                      { emoji: "🎯", title: "Selective Dating", desc: "Quality over quantity" },
                      { emoji: "🦋", title: "New to This", desc: "Just starting the journey" }
                    ].map((style, index) => (
                      <div 
                        key={style.title}
                        className="relative bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 text-center hover:border-gray-600/50 transition-all duration-300 hover:scale-105 cursor-pointer animate-scale-in group"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{style.emoji}</div>
                        <h3 className="font-bold text-white text-lg mb-2">{style.title}</h3>
                        <p className="text-gray-400 text-sm">{style.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Final CTA - Premium finish */}
            <div className="bg-gradient-to-b from-gray-950 to-black py-24">
              <div className="container mx-auto px-6 text-center">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-6xl font-black mb-8">Ready to Begin?</h2>
                  <p className="text-2xl text-gray-300 font-light mb-12 leading-relaxed">
                    Join an exclusive community where meaningful connections happen naturally.
                    Your person is waiting.
                  </p>
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-bold px-12 py-5 rounded-full shadow-2xl hover:shadow-violet-500/25 transition-all duration-500 text-xl">
                    Start Your Story ✨
                  </Button>
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
