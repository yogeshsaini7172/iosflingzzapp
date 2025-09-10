import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles } from "lucide-react";

interface SplashScreenProps {
  onContinue: () => void;
}

const SplashScreen = ({ onContinue }: SplashScreenProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className={`max-w-md w-full p-8 text-center shadow-medium transition-all duration-700 ${
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Heart className="w-16 h-16 text-primary animate-pulse-glow" fill="currentColor" />
              <Sparkles className="w-6 h-6 text-secondary absolute -top-2 -right-2 animate-float" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              FLINGZZ App
            </h1>
            <p className="text-muted-foreground text-lg">
              Connect, Match, Fling
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            The exclusive dating platform for verified students. Connect safely with identity-verified peers from your university and beyond.
          </p>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={onContinue}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              size="lg"
            >
              Get Started
            </Button>
            
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SplashScreen;