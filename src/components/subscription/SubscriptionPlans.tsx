import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionPlansProps {
  currentPlan?: 'free' | 'premium' | 'elite';
  onPlanSelect?: (plan: 'free' | 'premium' | 'elite') => void;
  showCurrentPlan?: boolean;
}

const SubscriptionPlans = ({ 
  currentPlan = 'free', 
  onPlanSelect,
  showCurrentPlan = true 
}: SubscriptionPlansProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const plans = [
    {
      id: 'free' as const,
      name: 'Free Plan',
      price: '₹0',
      period: 'Forever',
      description: 'Perfect to start connecting with fellow students',
      icon: <Star className="w-6 h-6" />,
      color: 'border-muted-foreground',
      features: [
        '10 swipes per day',
        'Match & chat after mutual swipes',
        'Standard profile visibility',
        'Basic text chat',
        'Campus filtering'
      ],
      limitations: [
        'Limited daily swipes',
        'No advanced filters',
        'Standard visibility'
      ]
    },
    {
      id: 'premium' as const,
      name: 'Premium Plan',
      price: '₹299',
      period: 'per month',
      description: 'Enhanced features for serious connections',
      icon: <Crown className="w-6 h-6" />,
      color: 'border-primary',
      popular: true,
      features: [
        'Unlimited swipes per day',
        'Priority visibility in feeds',
        'See "Who Liked Me"',
        'Advanced filters (age, campus, body type)',
        '1 free profile boost per week',
        'Premium chat with images & stickers',
        'Read receipts',
        'Extended matching radius'
      ],
      limitations: []
    },
    {
      id: 'elite' as const,
      name: 'Elite Plan',
      price: '₹599',
      period: 'per month',
      description: 'Ultimate experience with exclusive features',
      icon: <Zap className="w-6 h-6" />,
      color: 'border-accent',
      features: [
        'Everything in Premium',
        'Unlimited profile boosts',
        'Incognito mode (browse invisibly)',
        'Direct messaging without matches',
        'Exclusive events & communities',
        'Priority customer support',
        'Early access to new features',
        'Profile verification fast-track'
      ],
      limitations: []
    }
  ];

  const handlePlanSelect = async (planId: 'free' | 'premium' | 'elite') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to select a plan",
        variant: "destructive"
      });
      return;
    }

    if (planId === 'free') {
      // Handle free plan selection
      try {
        setIsLoading(true);
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            subscription_tier: 'free',
            swipes_left: 10,
            pairing_requests_left: 1,
            blinddate_requests_left: 0
          })
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Free plan activated! 🎉",
          description: "You now have 10 swipes per day"
        });

        onPlanSelect?.(planId);
      } catch (error: any) {
        console.error('Error selecting free plan:', error);
        toast({
          title: "Error",
          description: "Failed to activate free plan",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // For premium/elite, show upgrade message for now
      toast({
        title: "Coming Soon! 🚀",
        description: `${planId === 'premium' ? 'Premium' : 'Elite'} plan integration will be available soon. For now, enjoy the Free plan!`,
      });
      
      // Still call onPlanSelect to allow flow to continue
      onPlanSelect?.(planId);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${
                plan.id === 'free' ? 'bg-muted' : 
                plan.id === 'premium' ? 'bg-primary/20' : 'bg-accent/20'
              }`}>
                <span className={`${
                  plan.id === 'free' ? 'text-muted-foreground' : 
                  plan.id === 'premium' ? 'text-primary' : 'text-accent'
                }`}>
                  {plan.icon}
                </span>
              </div>
              
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
              
              <div className="mt-4">
                <div className="text-4xl font-bold">
                  {plan.price}
                </div>
                <div className="text-sm text-muted-foreground">{plan.period}</div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handlePlanSelect(plan.id)}
                disabled={isLoading || (currentPlan === plan.id && showCurrentPlan)}
                className={`w-full ${
                  plan.id === 'premium' ? 'bg-primary hover:bg-primary/90' :
                  plan.id === 'elite' ? 'bg-accent hover:bg-accent/90' :
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

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>All plans include campus verification • Secure & private • Cancel anytime</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;