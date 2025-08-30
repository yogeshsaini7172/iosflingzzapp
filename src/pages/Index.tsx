import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProfileCreation from "@/components/dating/ProfileCreation";
import SwipeCards from "@/components/dating/SwipeCards";
import BlindDateSetup from "@/components/dating/BlindDateSetup";
import MatchesList from "@/components/dating/MatchesList";
import DatingHeader from "@/components/dating/DatingHeader";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'swipe' | 'blind-date' | 'matches'>('home');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        return <ProfileCreation onComplete={() => setCurrentView('swipe')} />;
      case 'swipe':
        return <SwipeCards onNavigate={setCurrentView} />;
      case 'blind-date':
        return <BlindDateSetup onNavigate={setCurrentView} />;
      case 'matches':
        return <MatchesList onNavigate={setCurrentView} />;
      default:
        return (
          <main className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
            <DatingHeader />
            <div className="container mx-auto px-4 pt-24 pb-12">
              <div className="text-center space-y-8 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
                    className="text-lg px-8 py-6"
                  >
                    Create Profile
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentView('swipe')}
                    className="text-lg px-8 py-6"
                  >
                    Start Swiping
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                  <div 
                    className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setCurrentView('blind-date')}
                  >
                    <div className="text-4xl mb-4">🎭</div>
                    <h3 className="text-xl font-semibold mb-2">Blind Dating</h3>
                    <p className="text-muted-foreground">Experience the thrill of meeting someone new without seeing their photos first.</p>
                  </div>

                  <div 
                    className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setCurrentView('swipe')}
                  >
                    <div className="text-4xl mb-4">💕</div>
                    <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
                    <p className="text-muted-foreground">Our algorithm matches you with compatible students based on interests and preferences.</p>
                  </div>

                  <div 
                    className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setCurrentView('profile')}
                  >
                    <div className="text-4xl mb-4">🛡️</div>
                    <h3 className="text-xl font-semibold mb-2">Verified Identity</h3>
                    <p className="text-muted-foreground">All users are verified with government ID and student credentials for safety.</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-12">
                  <Button 
                    variant="ghost"
                    onClick={() => setCurrentView('matches')}
                  >
                    View Matches
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => setCurrentView('blind-date')}
                  >
                    Blind Dates
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