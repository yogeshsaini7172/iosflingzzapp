import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";

interface SubscriptionSelectorProps {
  onBack: () => void;
  onComplete: () => void;
}

const SubscriptionSelector = ({ onBack, onComplete }: SubscriptionSelectorProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'elite' | null>(null);

  const handlePlanSelect = (plan: 'free' | 'premium' | 'elite') => {
    setSelectedPlan(plan);
    // Auto-proceed after selecting a plan
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <Card className="border-0 shadow-elegant bg-gradient-card backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="rounded-full w-10 h-10 p-0 hover:bg-primary/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="text-sm text-muted-foreground font-prompt">
                Step 4 of 4 • Almost done! ✨
              </div>
              <div className="w-10" /> {/* Spacer */}
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Choose Your Experience
              </CardTitle>
              <CardDescription className="text-lg font-prompt">
                Start with our free plan and upgrade anytime to unlock premium features
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <SubscriptionPlans 
              onPlanSelect={handlePlanSelect}
              showCurrentPlan={false}
            />

            {selectedPlan && (
              <div className="mt-6 text-center">
                <div className="animate-fade-in">
                  <p className="text-success font-medium">
                    {selectedPlan === 'free' 
                      ? "🎉 Free plan activated! Redirecting to your dashboard..."
                      : `✨ ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan selected! Setting up your experience...`
                    }
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionSelector;