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
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-800">
            {/* Modern Dark Hero */}
            <div className="relative min-h-[50vh] bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white overflow-hidden">
              {/* Dynamic floating elements */}
              <div className="absolute inset-0">
                <div className="absolute top-8 left-6 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-16 right-4 w-28 h-28 bg-pink-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
                <div className="absolute bottom-12 left-1/3 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.8s'}}></div>
              </div>
              
              <div className="relative z-10 p-6 pt-20 pb-12">
                <div className="text-center animate-fade-in">
                  {/* Fresh, bold messaging */}
                  <div className="mb-6">
                    <h1 className="text-5xl font-black mb-4 leading-tight">
                      Dating Made<br/>
                      <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-emerald-400 bg-clip-text text-transparent">
                        Actually Fun
                      </span>
                    </h1>
                    <p className="text-xl font-medium text-gray-300 mb-6">
                      AI that gets you. Matches that matter. Zero BS.
                    </p>
                  </div>
                  
                  {/* Strong CTA */}
                  <div className="animate-scale-in" style={{animationDelay: '0.4s'}}>
                    <Button className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 mb-6">
                      Start Your Journey 🚀
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Modern stats bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-gray-700/50 p-4">
                <div className="flex justify-center items-center space-x-8 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg text-cyan-400">100K+</div>
                    <div className="text-gray-400">Active Singles</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-pink-400">25K+</div>
                    <div className="text-gray-400">Real Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-emerald-400">4.8⭐</div>
                    <div className="text-gray-400">User Rating</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-8 space-y-8 -mt-4 relative z-20">
              {/* Subscription Plans - Modern Cards */}
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-white mb-2">Choose Your Superpower</h2>
                  <p className="text-gray-400">Unlock your dating potential</p>
                </div>
                
                <div className="space-y-4">
                  {plans.map((plan, index) => (
                    <div
                      key={plan.id}
                      className={`relative overflow-hidden ${
                        index === 1 ? 'scale-105 ring-2 ring-cyan-500 z-10' : ''
                      } animate-scale-in`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Premium badge */}
                      {index === 1 && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                          <div className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-black shadow-xl">
                            ⚡ MOST POPULAR
                          </div>
                        </div>
                      )}
                      
                      <div className={`relative ${
                        index === 0 ? 'h-44 bg-gradient-to-br from-slate-800/80 to-slate-700/80' :
                        index === 1 ? 'h-52 bg-gradient-to-br from-cyan-900/50 to-pink-900/50' :
                        'h-48 bg-gradient-to-br from-emerald-900/50 to-slate-900/80'
                      } backdrop-blur-sm rounded-3xl border ${
                        index === 0 ? 'border-slate-600' :
                        index === 1 ? 'border-cyan-500/50' :
                        'border-emerald-500/50'
                      } shadow-xl overflow-hidden hover:scale-105 transition-all duration-500 cursor-pointer`}>
                        
                        {/* Glowing effects */}
                        <div className="absolute inset-0">
                          <div className={`absolute top-4 right-4 w-24 h-24 ${
                            index === 0 ? 'bg-slate-500/10' :
                            index === 1 ? 'bg-cyan-500/10' :
                            'bg-emerald-500/10'
                          } rounded-full blur-xl`}></div>
                          <div className={`absolute bottom-4 left-4 w-32 h-32 ${
                            index === 0 ? 'bg-slate-400/5' :
                            index === 1 ? 'bg-pink-500/5' :
                            'bg-emerald-400/5'
                          } rounded-full blur-2xl`}></div>
                        </div>
                        
                        <div className="relative h-full p-6 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                              <p className={`text-3xl font-black ${
                                index === 0 ? 'text-slate-300' :
                                index === 1 ? 'text-cyan-400' :
                                'text-emerald-400'
                              }`}>{plan.price}</p>
                            </div>
                            <div className="text-4xl">
                              {plan.id === 1 && "⚡"}
                              {plan.id === 2 && "🚀"}
                              {plan.id === 3 && "💎"}
                            </div>
                          </div>

                          <div className="flex-1 mb-4">
                            <div className="space-y-1">
                              {plan.features.slice(0, 3).map((feature, idx) => (
                                <div key={idx} className="flex items-center space-x-2">
                                  <span className={`text-sm ${
                                    index === 0 ? 'text-slate-400' :
                                    index === 1 ? 'text-cyan-400' :
                                    'text-emerald-400'
                                  }`}>✓</span>
                                  <span className="text-sm font-medium text-gray-300">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Button
                            className={`w-full font-bold ${
                              index === 1 ? 'bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600' :
                              index === 0 ? 'bg-slate-600 hover:bg-slate-700' :
                              'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'
                            } text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-12 text-lg`}
                            onClick={() => alert(`Welcome to ${plan.name}! 🎉`)}
                          >
                            {index === 1 ? '🚀 Go Premium' : `Get ${plan.name}`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dating Styles - Modern Grid */}
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-black text-white mb-2">What's Your Style?</h2>
                  <p className="text-gray-400">Choose your dating approach</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { emoji: "💕", title: "Serious Dating", desc: "Looking for love", color: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/30" },
                    { emoji: "✨", title: "Casual Vibes", desc: "Keep it light", color: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/30" },
                    { emoji: "🎯", title: "Selective", desc: "Quality over quantity", color: "from-emerald-500/20 to-green-500/20", border: "border-emerald-500/30" },
                    { emoji: "🔥", title: "Spontaneous", desc: "Go with the flow", color: "from-orange-500/20 to-red-500/20", border: "border-orange-500/30" }
                  ].map((style, index) => (
                    <div 
                      key={style.title}
                      className={`relative h-32 bg-gradient-to-br ${style.color} backdrop-blur-sm rounded-2xl border ${style.border} shadow-lg overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer animate-scale-in`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="relative h-full flex flex-col justify-center items-center p-4 text-center">
                        <div className="text-3xl mb-2">{style.emoji}</div>
                        <h3 className="font-bold text-white text-lg">{style.title}</h3>
                        <p className="text-gray-300 text-sm">{style.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Dashboard - Neon Style */}
              <div className="relative animate-scale-in">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-white">
                      Your Daily Potential ⚡
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { number: "10", label: "Smart Matches", icon: "🎯", color: "cyan", delay: "0s" },
                      { number: "5", label: "Quality Chats", icon: "💬", color: "pink", delay: "0.1s" },
                      { number: "1", label: "Perfect Match", icon: "⚡", color: "emerald", delay: "0.2s" }
                    ].map((stat, index) => (
                      <div 
                        key={index} 
                        className="text-center group cursor-pointer animate-scale-in hover:scale-110 transition-all duration-300"
                        style={{animationDelay: stat.delay}}
                      >
                        <div className={`relative w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${
                          stat.color === 'cyan' ? 'from-cyan-400 to-cyan-600' :
                          stat.color === 'pink' ? 'from-pink-400 to-pink-600' :
                          'from-emerald-400 to-emerald-600'
                        } rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                          <div className="text-xl group-hover:animate-pulse">{stat.icon}</div>
                          <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className={`text-3xl font-black ${
                          stat.color === 'cyan' ? 'text-cyan-400' :
                          stat.color === 'pink' ? 'text-pink-400' :
                          'text-emerald-400'
                        } group-hover:scale-110 transition-all`}>
                          {stat.number}
                        </div>
                        <div className="text-xs text-gray-400 font-semibold">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* How it works - Simplified */}
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-center text-white mb-4">How We're Different</h2>
                <div className="space-y-3">
                  {[
                    { emoji: "🤖", text: "AI learns your preferences", gradient: "from-cyan-500/10 to-blue-500/10" },
                    { emoji: "🎯", text: "Only quality matches daily", gradient: "from-pink-500/10 to-rose-500/10" },
                    { emoji: "⚡", text: "Instant chemistry detection", gradient: "from-emerald-500/10 to-green-500/10" }
                  ].map((item, index) => (
                    <div 
                      key={index}
                      className={`relative h-16 bg-gradient-to-r ${item.gradient} backdrop-blur-sm rounded-2xl p-4 border border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-scale-in`}
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      <div className="flex items-center space-x-4 h-full">
                        <div className="text-2xl">{item.emoji}</div>
                        <p className="font-semibold text-white">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final CTA */}
              <div className="text-center py-6 animate-fade-in">
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-6 inline-block border border-slate-700/30">
                  <p className="text-lg font-bold text-white mb-4">
                    Ready to date smarter? ⚡
                  </p>
                  <Button className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                    Let's Go! 🚀
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
