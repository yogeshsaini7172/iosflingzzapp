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
          <div className="flex-1 overflow-y-auto bg-gradient-royal text-white min-h-screen scroll-smooth relative">
            {/* Premium Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 animate-shimmer"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-10 left-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl animate-float"></div>
              <div className="absolute top-1/3 right-20 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-pulse-glow delay-1000"></div>
              <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-secondary/20 rounded-full blur-lg animate-float delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-primary-glow/20 rounded-full blur-md animate-pulse-glow delay-500"></div>
            </div>
            
            {/* Premium Hero Section */}
            <div className="relative min-h-screen bg-gradient-elegant flex flex-col justify-center items-center px-4 overflow-hidden">
              {/* Luxury Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 animate-shimmer"></div>
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-primary rounded-full blur-xl animate-float opacity-30"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-gold rounded-full blur-xl animate-pulse-glow delay-300 opacity-40"></div>
              <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-rose rounded-full blur-lg animate-float delay-500 opacity-50"></div>
              
              {/* Elegant Card Effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-80 h-96 glass-luxury rounded-3xl opacity-20 rotate-12 shadow-premium"></div>
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-72 h-96 glass-dark-luxury rounded-3xl opacity-30 -rotate-6 shadow-royal"></div>
              </div>
              
              <div className="relative z-10 text-center max-w-sm mx-auto">
                <div className="mb-8 animate-elegant-entrance">
                  <h1 className="text-6xl font-elegant font-black leading-tight mb-6 tracking-tight">
                    Find Your<br/>
                    <span className="text-gradient-royal animate-shimmer">
                      Perfect Match
                    </span>
                  </h1>
                  <p className="text-foreground/80 text-lg font-light leading-relaxed font-modern">
                    Elite connections.<br/>Verified authenticity.
                  </p>
                </div>
                
                <div className="space-y-6 animate-slide-up">
                  <button className="w-full bg-gradient-primary text-white font-bold py-4 px-8 rounded-full text-lg shadow-premium hover-luxury transition-luxury font-modern">
                    Start Your Journey
                  </button>
                  <div className="flex justify-center space-x-8 text-sm text-foreground/60">
                    <div className="text-center animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                      <div className="font-bold text-gradient-gold text-lg">50K+</div>
                      <div className="font-modern">Elite Members</div>
                    </div>
                    <div className="text-center animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                      <div className="font-bold text-gradient-primary text-lg">15K+</div>
                      <div className="font-modern">Perfect Matches</div>
                    </div>
                    <div className="text-center animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                      <div className="font-bold text-gradient-rose text-lg">4.9⭐</div>
                      <div className="font-modern">Premium Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Us - Premium Experience */}
            <div className="relative min-h-screen bg-gradient-royal flex flex-col justify-center items-center px-4 overflow-hidden">
              {/* Luxury Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-accent/15 to-secondary/15 animate-shimmer"></div>
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-secondary rounded-full blur-xl animate-float opacity-30"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-rose rounded-full blur-xl animate-pulse-glow delay-300 opacity-40"></div>
              <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-primary rounded-full blur-lg animate-float delay-500 opacity-50"></div>
              
              <div className="relative z-10 text-center max-w-sm mx-auto">
                <div className="mb-8 animate-elegant-entrance">
                  <h1 className="text-6xl font-elegant font-black leading-tight mb-6 tracking-tight">
                    ✨ Why Choose<br/>
                    <span className="text-gradient-gold animate-shimmer">
                      Excellence?
                    </span>
                  </h1>
                  <p className="text-foreground/80 text-lg font-light leading-relaxed font-modern">
                    Experience luxury dating 💎
                  </p>
                </div>
                
                <div className="space-y-6 animate-slide-up">
                  <div className="text-center space-y-4">
                    <div className="glass-luxury rounded-2xl p-6 border-gradient shadow-royal hover-elegant">
                      <div className="text-4xl mb-3 animate-pulse-glow">🧠</div>
                      <h3 className="text-xl font-bold text-gradient-primary mb-2 font-elegant">Smart AI Matching</h3>
                      <p className="text-foreground/70 text-sm leading-relaxed font-modern">
                        Advanced algorithms find your perfect compatibility
                      </p>
                    </div>
                    <div className="glass-luxury rounded-2xl p-6 border-gradient shadow-gold hover-elegant">
                      <div className="text-4xl mb-3 animate-pulse-glow">✨</div>
                      <h3 className="text-xl font-bold text-gradient-gold mb-2 font-elegant">Elite Quality</h3>
                      <p className="text-foreground/70 text-sm leading-relaxed font-modern">
                        Curated matches daily, verified authenticity
                      </p>
                    </div>
                    <div className="glass-luxury rounded-2xl p-6 border-gradient shadow-premium hover-elegant">
                      <div className="text-4xl mb-3 animate-pulse-glow">🔐</div>
                      <h3 className="text-xl font-bold text-gradient-royal mb-2 font-elegant">Verified Excellence</h3>
                      <p className="text-foreground/70 text-sm leading-relaxed font-modern">
                        Real people, premium connections only
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Style - Premium Selection */}
            <div className="relative min-h-screen bg-gradient-elegant flex flex-col justify-center items-center px-4 overflow-hidden">
              {/* Luxury Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent/15 via-primary/15 to-secondary/15 animate-shimmer"></div>
              <div className="absolute top-1/4 right-1/4 w-28 h-28 bg-gradient-rose rounded-full blur-xl animate-float delay-200 opacity-40"></div>
              <div className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-gradient-gold rounded-full blur-xl animate-pulse-glow delay-700 opacity-50"></div>
              
              <div className="relative z-10 text-center max-w-sm mx-auto">
                <div className="mb-8 animate-elegant-entrance">
                  <h1 className="text-6xl font-elegant font-black leading-tight mb-6 tracking-tight">
                    Your<br/>
                    <span className="text-gradient-royal animate-shimmer">
                      Preference
                    </span>
                  </h1>
                  <p className="text-foreground/80 text-lg font-light leading-relaxed font-modern">
                    Define your perfect connection
                  </p>
                </div>
                
                <div className="space-y-4 animate-slide-up">
                  <div className="glass-luxury rounded-2xl p-6 border-gradient shadow-premium hover-elegant">
                    <p className="text-xl font-bold text-gradient-primary font-elegant mb-2">💜 Serious Relationship</p>
                    <p className="text-foreground/70 text-sm font-modern">Ready for something meaningful</p>
                  </div>
                  <div className="glass-dark-luxury rounded-2xl p-4 border border-border/50 hover-luxury transition-elegant">
                    <p className="text-base text-foreground/80 font-modern">✨ Casual - Keep it elegant</p>
                  </div>
                  <div className="glass-dark-luxury rounded-2xl p-4 border border-border/50 hover-luxury transition-elegant">
                    <p className="text-base text-foreground/80 font-modern">🌙 Slow Burn - Take your time</p>
                  </div>
                  <div className="glass-dark-luxury rounded-2xl p-4 border border-border/50 hover-luxury transition-elegant">
                    <p className="text-base text-foreground/80 font-modern">🎭 Complex - It's sophisticated</p>
                  </div>
                  <div className="glass-dark-luxury rounded-2xl p-4 border border-border/50 hover-luxury transition-elegant">
                    <p className="text-base text-foreground/80 font-modern">🎯 Selective - Premium quality</p>
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
