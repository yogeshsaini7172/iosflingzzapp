import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";
import { type PlanId } from "@/config/subscriptionPlans";

interface SubscriptionSelectorProps {
  onBack: () => void;
  onComplete: () => void;
  onSkip?: () => void;
}

const SubscriptionSelector = ({ onBack, onComplete, onSkip }: SubscriptionSelectorProps) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const handlePlanSelect = (plan: PlanId) => {
    setSelectedPlan(plan);
    // Auto-proceed after selecting a plan
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        <Card className="border-0 shadow-premium bg-gradient-card backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-10">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="rounded-full w-12 h-12 p-0 hover:bg-primary/10 transition-luxury hover-luxury"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="text-sm text-muted-foreground font-modern font-medium">
                Choose Your Experience ✨
              </div>
              <div className="w-12" /> {/* Spacer */}
            </div>
            
            <div className="space-y-4">
              <CardTitle className="text-4xl font-elegant font-bold text-gradient-royal animate-fade-in">
                Choose Your Experience
              </CardTitle>
              <CardDescription className="text-lg font-modern text-muted-foreground">
                Unlock premium features and enhance your campus connections
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <SubscriptionPlans 
              onPlanSelect={handlePlanSelect}
              showCurrentPlan={false}
              onSkip={onSkip || onComplete}
            />

            {selectedPlan && (
              <div className="mt-8 text-center">
                <div className="animate-bounce-in">
                  <p className="text-success font-semibold font-modern text-lg">
                    ✨ {selectedPlan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} plan selected! Preparing your premium experience...
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