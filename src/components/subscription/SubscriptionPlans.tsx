import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Gem } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlansProps {
  currentPlan?: 'free' | 'silver' | 'gold' | 'platinum';
  onPlanSelect?: (plan: 'free' | 'silver' | 'gold' | 'platinum') => void;
  showCurrentPlan?: boolean;
  onSkip?: () => void;
}

const SubscriptionPlans = ({ 
  currentPlan = 'free', 
  onPlanSelect,
  showCurrentPlan = true,
  onSkip 
}: SubscriptionPlansProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: 'free' as const,
      name: 'Free Plan',
      price: '₹0',
      period: 'Forever',
      description: 'Get started with basic features',
      icon: <Star className="w-6 h-6" />,
      color: 'border-muted-foreground',
      bgColor: 'bg-muted/20',
      textColor: 'text-muted-foreground',
      features: [
        '10 swipes per day',
        'Match & chat after mutual right swipe',
        'Standard profile visibility'
      ]
    },
    {
      id: 'silver' as const,
      name: 'Silver Plan',
      price: '₹49',
      period: 'per month',
      description: 'Unlock more connections',
      icon: <Crown className="w-6 h-6" />,
      color: 'border-slate-400',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      popular: true,
      features: [
        'Unlock & see all 10 profiles in daily pairing',
        'Unlimited swipes',
        '2 Blind Date requests per month'
      ]
    },
    {
      id: 'gold' as const,
      name: 'Gold Plan',
      price: '₹89',
      period: 'per month',
      description: 'Enhanced matching power',
      icon: <Gem className="w-6 h-6" />,
      color: 'border-yellow-400',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      features: [
        'Everything in Silver (₹49 plan)',
        '+2 extra pairing requests per day',
        '4 Blind Date requests per month'
      ]
    },
    {
      id: 'platinum' as const,
      name: 'Platinum Plan',
      price: '₹129',
      period: 'per month',
      description: 'Ultimate dating experience',
      icon: <Zap className="w-6 h-6" />,
      color: 'border-purple-400',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      features: [
        'Everything in Gold (₹89 plan)',
        '+10 extra pairing requests per day',
        'Unlimited Blind Date requests'
      ]
    }
  ];

  const handlePlanSelect = async (planId: 'free' | 'silver' | 'gold' | 'platinum') => {
    try {
      setIsLoading(true);
      
      // Get demo user ID from localStorage
      const demoUserId = localStorage.getItem('demoUserId');
      if (!demoUserId) {
        toast({
          title: "Profile required",
          description: "Please complete your profile first",
          variant: "destructive"
        });
        return;
      }

      // Update localStorage with selected plan
      const existingProfile = JSON.parse(localStorage.getItem('demoProfile') || '{}');
      
      let planLimits;
      switch(planId) {
        case 'free':
          planLimits = {
            subscription_tier: 'free',
            swipes_left: 10,
            pairing_requests_left: 1,
            blinddate_requests_left: 0
          };
          break;
        case 'silver':
          planLimits = {
            subscription_tier: 'silver',
            swipes_left: -1, // unlimited
            pairing_requests_left: 10,
            blinddate_requests_left: 2
          };
          break;
        case 'gold':
          planLimits = {
            subscription_tier: 'gold', 
            swipes_left: -1, // unlimited
            pairing_requests_left: 12, // 10 + 2 extra
            blinddate_requests_left: 4
          };
          break;
        case 'platinum':
          planLimits = {
            subscription_tier: 'platinum',
            swipes_left: -1, // unlimited
            pairing_requests_left: 20, // 10 + 10 extra
            blinddate_requests_left: -1 // unlimited
          };
          break;
      }

      const updatedProfile = { ...existingProfile, ...planLimits };
      localStorage.setItem('demoProfile', JSON.stringify(updatedProfile));

      if (planId === 'free') {
        toast({
          title: "Free plan activated! 🎉",
          description: "You now have 10 swipes per day"
        });
      } else {
        toast({
          title: `${planId.charAt(0).toUpperCase() + planId.slice(1)} plan selected! 💫`,
          description: "Payment integration coming soon. Enjoy premium features!"
        });
      }

      onPlanSelect?.(planId);
    } catch (error: any) {
      console.error('Error selecting plan:', error);
      toast({
        title: "Error",
        description: "Failed to select plan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground text-lg">
          Select the perfect plan to enhance your campus connection experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative transition-all duration-300 hover:shadow-lg ${
              plan.popular ? 'ring-2 ring-primary scale-105' : ''
            } ${currentPlan === plan.id && showCurrentPlan ? 'bg-primary/5' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            )}
            
            {currentPlan === plan.id && showCurrentPlan && (
              <Badge className="absolute -top-3 right-4 bg-success text-success-foreground">
                Current Plan
              </Badge>
            )}

            <CardHeader className="text-center">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${plan.bgColor}`}>
                <span className={plan.textColor}>
                  {plan.icon}
                </span>
              </div>
              
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
              
              <div className="mt-4">
                <div className="text-3xl font-bold">
                  {plan.price}
                </div>
                <div className="text-sm text-muted-foreground">{plan.period}</div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handlePlanSelect(plan.id)}
                disabled={isLoading || (currentPlan === plan.id && showCurrentPlan)}
                className={`w-full ${
                  plan.id === 'silver' ? 'bg-slate-500 hover:bg-slate-600' :
                  plan.id === 'gold' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  plan.id === 'platinum' ? 'bg-purple-500 hover:bg-purple-600' :
                  'bg-muted hover:bg-muted/90 text-muted-foreground'
                }`}
                variant={plan.id === 'free' ? 'outline' : 'default'}
              >
                {currentPlan === plan.id && showCurrentPlan ? 
                  'Current Plan' : 
                  plan.id === 'free' ? 'Select Free Plan' : 'Upgrade Now'
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skip Button */}
      {onSkip && (
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
            Skip for now - I'll choose later
          </Button>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>All plans include campus verification • Secure & private • Cancel anytime</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;