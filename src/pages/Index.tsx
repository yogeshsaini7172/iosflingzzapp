import { useState } from "react";
import { Button } from "@/components/ui/button";
import SplashScreen from "@/components/onboarding/SplashScreen";
import LoginOptions from "@/components/onboarding/LoginOptions";
import EnhancedProfileCreation from "@/components/dating/EnhancedProfileCreation";
import ModernSwipeCards from "@/components/dating/ModernSwipeCards";
import BlindDateSetup from "@/components/dating/BlindDateSetup";
import MatchesList from "@/components/dating/MatchesList";
import ModernChatScreen from "@/components/chat/ModernChatScreen";
import ExploreScreen from "@/components/explore/ExploreScreen";
import DatingHeader from "@/components/dating/DatingHeader";

const Index = () => {
  const [currentView, setCurrentView] = useState<'splash' | 'login' | 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches' | 'chat' | 'explore'>('splash');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'splash':
        return <SplashScreen onContinue={() => setCurrentView('login')} />;
      case 'login':
        return <LoginOptions onBack={() => setCurrentView('splash')} onContinue={() => setCurrentView('home')} />;
      case 'profile':
        return <EnhancedProfileCreation onComplete={() => setCurrentView('home')} onBack={() => setCurrentView('home')} />;
      case 'swipe':
        return <ModernSwipeCards onNavigate={setCurrentView} />;
      case 'blind-date':
        return <BlindDateSetup onNavigate={setCurrentView} />;
      case 'matches':
        return <MatchesList onNavigate={setCurrentView} />;
      case 'chat':
        return <ModernChatScreen onNavigate={setCurrentView} />;
      case 'explore':
        return <ExploreScreen onNavigate={setCurrentView} />;
      default:
        return (
          <main className="min-h-screen bg-gradient-soft">
            <DatingHeader />
            
            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border shadow-soft z-50">
              <div className="container mx-auto px-4 py-2">
                <div className="flex justify-around items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('swipe')}
                    className="flex-col h-auto py-2 px-3"
                  >
                    <div className="text-2xl mb-1">💕</div>
                    <span className="text-xs">Discover</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('chat')}
                    className="flex-col h-auto py-2 px-3"
                  >
                    <div className="text-2xl mb-1">💬</div>
                    <span className="text-xs">Chat</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('explore')}
                    className="flex-col h-auto py-2 px-3"
                  >
                    <div className="text-2xl mb-1">🌟</div>
                    <span className="text-xs">Explore</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('profile')}
                    className="flex-col h-auto py-2 px-3"
                  >
                    <div className="text-2xl mb-1">👤</div>
                    <span className="text-xs">Profile</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-4 pt-24 pb-24">
              <div className="text-center space-y-8 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-bold bg-gradient-hero bg-clip-text text-transparent animate-float">
                    Find Your Perfect
                    <span className="block">Student Match</span>
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    The exclusive dating platform for verified students. Connect safely with identity-verified peers from your university and beyond.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    size="lg"
                    onClick={() => setCurrentView('profile')}
                    className="text-lg px-8 py-6 bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    Create Profile
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentView('swipe')}
                    className="text-lg px-8 py-6 border-2 hover:bg-primary/10 transition-all duration-300"
                  >
                    Start Swiping
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                  <div 
                    className="bg-card shadow-card border-0 rounded-2xl p-6 cursor-pointer hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                    onClick={() => setCurrentView('blind-date')}
                  >
                    <div className="text-4xl mb-4">🎭</div>
                    <h3 className="text-xl font-semibold mb-2">Blind Dating</h3>
                    <p className="text-muted-foreground">Experience the thrill of meeting someone new without seeing their photos first.</p>
                  </div>

                  <div 
                    className="bg-card shadow-card border-0 rounded-2xl p-6 cursor-pointer hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                    onClick={() => setCurrentView('swipe')}
                  >
                    <div className="text-4xl mb-4">💕</div>
                    <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
                    <p className="text-muted-foreground">Our algorithm matches you with compatible students based on interests and preferences.</p>
                  </div>

                  <div 
                    className="bg-card shadow-card border-0 rounded-2xl p-6 cursor-pointer hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                    onClick={() => setCurrentView('explore')}
                  >
                    <div className="text-4xl mb-4">🌟</div>
                    <h3 className="text-xl font-semibold mb-2">Campus Events</h3>
                    <p className="text-muted-foreground">Join virtual speed dating nights and interest-based group chats.</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-12">
                  <Button 
                    variant="ghost"
                    onClick={() => setCurrentView('matches')}
                    className="hover:bg-primary/10 transition-colors"
                  >
                    View Matches
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => setCurrentView('chat')}
                    className="hover:bg-primary/10 transition-colors"
                  >
                    Messages
                  </Button>
                </div>
              </div>
            </div>
          </main>
        );
    }
  };

  return renderCurrentView();
};

export default Index;