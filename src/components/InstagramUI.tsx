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
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-purple-50 dark:from-background dark:to-violet-950/20">
            {/* Purple Hero Section - Like Screenshot */}
            <div className="relative min-h-[55vh] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
              {/* Floating elements */}
              <div className="absolute inset-0">
                <div className="absolute top-8 left-6 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-16 right-4 w-28 h-28 bg-white/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
                <div className="absolute bottom-12 left-1/3 w-36 h-36 bg-white/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.8s'}}></div>
              </div>
              
              <div className="relative z-10 p-6 pt-20 pb-8">
                <div className="text-center animate-fade-in">
                  <div className="mb-8">
                    <h1 className="text-5xl font-black mb-4 leading-tight">
                      Find Your<br/>
                      <span className="bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
                        Perfect Match
                      </span>
                    </h1>
                    <p className="text-xl font-medium opacity-95 mb-8">
                      No endless swiping. Just 10 perfect matches daily.
                    </p>
                    
                    {/* Primary CTA */}
                    <Button className="bg-white text-violet-600 hover:bg-violet-50 text-lg font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-white/20 transition-all duration-300 mb-8">
                      Start Finding Love 💜
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Social proof banner */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-sm border-t border-white/20 p-4">
                <div className="flex justify-center items-center space-x-8 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg">50K+</div>
                    <div className="opacity-80">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">10K+</div>
                    <div className="opacity-80">Matches Made</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">4.9⭐</div>
                    <div className="opacity-80">App Rating</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-8 space-y-8 -mt-4 relative z-20">
              {/* Why We're Different - NEW CONTENT */}
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-2">Why DatingSigma?</h2>
                  <p className="text-violet-600 dark:text-violet-300">The smarter way to find love</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { 
                      icon: "🧠", 
                      title: "AI-Powered Matching", 
                      desc: "Our algorithm learns your preferences and finds your ideal match based on 200+ compatibility factors",
                      color: "from-violet-100/50 to-violet-200/50"
                    },
                    { 
                      icon: "⚡", 
                      title: "Instant Chemistry Detection", 
                      desc: "Skip the small talk. Our compatibility score shows instant chemistry potential before you even match",
                      color: "from-purple-100/50 to-purple-200/50"
                    },
                    { 
                      icon: "🎯", 
                      title: "Quality Over Quantity", 
                      desc: "Only 10 curated matches daily means every profile you see has serious potential",
                      color: "from-indigo-100/50 to-indigo-200/50"
                    },
                    { 
                      icon: "🔒", 
                      title: "Verified Profiles Only", 
                      desc: "ID verification ensures you're talking to real people, not fake profiles or bots",
                      color: "from-violet-100/50 to-purple-200/50"
                    }
                  ].map((feature, index) => (
                    <div 
                      key={feature.title}
                      className={`relative bg-gradient-to-br ${feature.color} dark:from-violet-900/20 dark:to-violet-800/20 backdrop-blur-sm rounded-2xl p-6 border border-violet-300/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-scale-in`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl flex-shrink-0">{feature.icon}</div>
                        <div>
                          <h3 className="text-lg font-bold text-violet-900 dark:text-violet-100 mb-2">{feature.title}</h3>
                          <p className="text-sm text-violet-700 dark:text-violet-300">{feature.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription Plans */}
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-2">Choose Your Journey</h2>
                  <p className="text-violet-600 dark:text-violet-300">Unlock your dating potential</p>
                </div>
                
                <div className="space-y-4">
                  {plans.map((plan, index) => (
                    <div
                      key={plan.id}
                      className={`relative overflow-hidden ${
                        index === 1 ? 'scale-105 ring-2 ring-violet-500 z-10' : ''
                      } animate-scale-in`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Most Popular Badge */}
                      {index === 1 && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                          <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-black shadow-xl">
                            ⭐ MOST POPULAR
                          </div>
                        </div>
                      )}
                      
                      <div className={`relative ${
                        index === 0 ? 'h-48 bg-gradient-to-br from-violet-100/80 to-violet-200/80 dark:from-violet-900/30 dark:to-violet-800/30' :
                        index === 1 ? 'h-56 bg-gradient-to-br from-violet-500/30 to-purple-500/30' :
                        'h-52 bg-gradient-to-br from-violet-600/30 to-indigo-600/30'
                      } backdrop-blur-sm rounded-3xl border-2 ${
                        index === 0 ? 'border-violet-300 dark:border-violet-700' :
                        index === 1 ? 'border-violet-500' :
                        'border-violet-600'
                      } shadow-xl overflow-hidden hover:scale-105 transition-all duration-500 cursor-pointer`}>
                        
                        <div className="absolute inset-0">
                          <div className="absolute top-4 right-4 w-24 h-24 bg-violet-500/10 rounded-full blur-xl"></div>
                          <div className="absolute bottom-4 left-4 w-32 h-32 bg-violet-400/5 rounded-full blur-2xl"></div>
                        </div>
                        
                        <div className="relative h-full p-6 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-2xl font-black text-violet-900 dark:text-violet-100">{plan.name}</h3>
                              <p className="text-3xl font-black text-violet-600">{plan.price}</p>
                            </div>
                            <div className="text-4xl">
                              {plan.id === 1 && "💜"}
                              {plan.id === 2 && "👑"}
                              {plan.id === 3 && "💎"}
                            </div>
                          </div>

                          <div className="flex-1 mb-4">
                            <div className="space-y-2">
                              {plan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center space-x-2">
                                  <span className="text-violet-500 text-sm">✓</span>
                                  <span className="text-sm font-medium text-violet-800 dark:text-violet-200">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Button
                            className={`w-full font-bold ${
                              index === 1 ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700' :
                              'bg-violet-600 hover:bg-violet-700'
                            } text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-12 text-lg`}
                            onClick={() => alert(`Welcome to ${plan.name}! 💜`)}
                          >
                            {index === 1 ? '🚀 Get Premium' : `Choose ${plan.name}`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Stories - NEW CONTENT */}
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-2">Real Success Stories</h2>
                  <p className="text-violet-600 dark:text-violet-300">Love found through DatingSigma</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
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
                      className="relative bg-gradient-to-br from-violet-100/50 to-violet-200/50 dark:from-violet-900/20 dark:to-violet-800/20 backdrop-blur-sm rounded-2xl p-6 border border-violet-300/30 shadow-lg animate-scale-in"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      <div className="text-center">
                        <p className="text-violet-800 dark:text-violet-200 font-medium italic mb-4">"{story.quote}"</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-violet-700 dark:text-violet-300">{story.author}</span>
                          <span className="text-xs bg-violet-500 text-white px-3 py-1 rounded-full">{story.match}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dating Preferences - Enhanced */}
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-2">What's Your Style?</h2>
                  <p className="text-violet-600 dark:text-violet-300">Tell us what you're looking for</p>
                </div>
                
                <div className="space-y-4">
                  {/* Serious Relationship - Priority */}
                  <div className="animate-scale-in">
                    <div className="relative h-40 bg-gradient-to-br from-violet-200/40 to-violet-300/40 dark:from-violet-800/30 dark:to-violet-700/30 backdrop-blur-sm rounded-3xl border-2 border-violet-400/50 shadow-xl overflow-hidden hover:scale-105 transition-all duration-500 cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                      <div className="relative h-full flex items-center justify-between p-8">
                        <div>
                          <div className="text-5xl mb-2">💜</div>
                          <h3 className="text-2xl font-black text-violet-800 dark:text-violet-200">Serious Relationship</h3>
                          <p className="text-violet-600 dark:text-violet-400 font-medium">Ready for something real and meaningful</p>
                        </div>
                        <div className="text-7xl opacity-20 text-violet-500">💕</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Other preferences */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="animate-scale-in" style={{animationDelay: '0.1s'}}>
                      <div className="relative h-28 bg-gradient-to-br from-violet-150/30 to-violet-200/30 backdrop-blur-sm rounded-2xl border border-violet-300/40 shadow-lg overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer">
                        <div className="relative h-full flex flex-col justify-center items-center p-4 text-center">
                          <div className="text-3xl mb-1">🌟</div>
                          <h3 className="text-sm font-bold text-violet-700 dark:text-violet-300">Casual Dating</h3>
                          <p className="text-xs text-violet-600 dark:text-violet-400">Keep it fun & light</p>
                        </div>
                      </div>
                    </div>
                    <div className="animate-scale-in" style={{animationDelay: '0.2s'}}>
                      <div className="relative h-28 bg-gradient-to-br from-violet-150/30 to-violet-200/30 backdrop-blur-sm rounded-2xl border border-violet-300/40 shadow-lg overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer">
                        <div className="relative h-full flex flex-col justify-center items-center p-4 text-center">
                          <div className="text-3xl mb-1">🤝</div>
                          <h3 className="text-sm font-bold text-violet-700 dark:text-violet-300">Friendship First</h3>
                          <p className="text-xs text-violet-600 dark:text-violet-400">Build a foundation</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Dashboard */}
              <div className="relative animate-scale-in">
                <div className="bg-gradient-to-br from-violet-100/60 to-violet-200/60 dark:from-violet-900/30 dark:to-violet-800/30 backdrop-blur-xl rounded-3xl p-6 border border-violet-300/40 shadow-xl">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-violet-900 dark:text-violet-100">
                      Your Daily Potential 💜
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { number: "10", label: "Perfect Matches", icon: "🎯", delay: "0s" },
                      { number: "3", label: "Quality Chats", icon: "💬", delay: "0.1s" },
                      { number: "1", label: "Real Connection", icon: "⚡", delay: "0.2s" }
                    ].map((stat, index) => (
                      <div 
                        key={index} 
                        className="text-center group cursor-pointer animate-scale-in hover:scale-110 transition-all duration-300"
                        style={{animationDelay: stat.delay}}
                      >
                        <div className="relative w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <div className="text-xl group-hover:animate-pulse">{stat.icon}</div>
                          <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="text-3xl font-black text-violet-600 group-hover:text-violet-500 transition-colors">
                          {stat.number}
                        </div>
                        <div className="text-xs text-violet-700 dark:text-violet-300 font-semibold">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safety & Security - NEW CONTENT */}
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-center text-violet-900 dark:text-violet-100 mb-4">Safe & Secure Dating</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: "🔒", text: "End-to-end encryption" },
                    { emoji: "🛡️", text: "Profile verification" },
                    { emoji: "📱", text: "Block & report tools" },
                    { emoji: "👥", text: "24/7 support team" }
                  ].map((item, index) => (
                    <div 
                      key={index}
                      className="relative h-16 bg-gradient-to-r from-violet-100/50 to-violet-200/50 dark:from-violet-900/20 dark:to-violet-800/20 backdrop-blur-sm rounded-2xl p-4 border border-violet-300/30 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-scale-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center space-x-3 h-full">
                        <div className="text-xl">{item.emoji}</div>
                        <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final CTA */}
              <div className="text-center py-8 animate-fade-in">
                <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-sm rounded-3xl p-8 inline-block border border-violet-300/40">
                  <p className="text-xl font-bold text-violet-700 dark:text-violet-300 mb-4">
                    Ready to find your perfect match? 💜
                  </p>
                  <Button className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold px-10 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 text-lg">
                    Start Your Love Story ✨
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
