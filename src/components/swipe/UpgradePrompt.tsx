import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, X } from "lucide-react";

interface UpgradePromptProps {
  reason: 'daily_limit' | 'premium_feature';
  onUpgrade: () => void;
  onDismiss: () => void;
}

const UpgradePrompt = ({ reason, onUpgrade, onDismiss }: UpgradePromptProps) => {
  const getContent = () => {
    switch (reason) {
      case 'daily_limit':
        return {
          title: "Daily Swipe Limit Reached! 🚫",
          description: "You've used all your daily swipes. Upgrade to Premium for unlimited swipes and more!",
          features: ["Unlimited daily swipes", "See who liked you", "Priority visibility"]
        };
      case 'premium_feature':
        return {
          title: "Premium Feature 👑",
          description: "This feature is available for Premium and Elite subscribers only.",
          features: ["Advanced filters", "Premium chat features", "Profile boosts"]
        };
      default:
        return {
          title: "Upgrade to Premium",
          description: "Unlock exclusive features and enhance your experience!",
          features: ["Unlimited features", "Priority support"]
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
        <CardHeader className="relative text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          <CardTitle className="text-xl">{content.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            {content.description}
          </p>
          
          <div className="space-y-2">
            {content.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="pt-4 space-y-3">
            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              size="lg"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium - ₹299/month
            </Button>
            
            <Button
              onClick={onDismiss}
              variant="ghost"
              className="w-full"
              size="sm"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradePrompt;