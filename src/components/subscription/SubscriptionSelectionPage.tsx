import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionSelectionPageProps {
  onComplete: (tier: string) => void;
}

const SubscriptionSelectionPage = ({ onComplete }: SubscriptionSelectionPageProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const { toast } = useToast();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Get started with basic features',
      icon: <Star className="w-6 h-6" />,
      features: [
        '20 swipes per day',
        '1 pairing request per day',
        'Basic profile visibility',
        'Standard matching algorithm'
      ],
      buttonText: 'Continue Free',
      popular: false,
      color: 'border-gray-200'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$9.99',
      period: '/month',
      description: 'Enhanced features for better matches',
      icon: <Zap className="w-6 h-6 text-primary" />,
      features: [
        'Unlimited swipes',
        '10 pairing requests per day',
        'Priority profile visibility',
        'Advanced matching algorithm',
        'See who liked you',
        'Read receipts'
      ],
      buttonText: 'Start Basic Plan',
      popular: true,
      color: 'border-primary/50 bg-primary/10'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99',
      period: '/month',
      description: 'Ultimate dating experience',
      icon: <Crown className="w-6 h-6 text-secondary" />,
      features: [
        'Everything in Basic',
        'Unlimited pairing requests',
        'Unlimited blind dates',
        'Profile boost (3x visibility)',
        'Super likes',
        'Advanced filters',
        'AI-powered insights',
        'Premium support'
      ],
      buttonText: 'Go Premium',
      popular: false,
      color: 'border-secondary/50 bg-secondary/10'
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    
    if (planId === 'free') {
      // Immediate selection for free plan
      toast({
        title: "Welcome to datingSigma! 🎉",
        description: "You can upgrade anytime from your profile settings."
      });
      onComplete('free');
    } else {
      // For paid plans, just select for now (no payment processing)
      toast({
        title: `${plans.find(p => p.id === planId)?.name} Plan Selected`,
        description: "Payment processing will be available soon!"
      });
      onComplete(planId);
    }
  };

  const handleSkip = () => {
    toast({
      title: "Welcome to datingSigma! 🎉",
      description: "You're starting with the free plan. You can upgrade anytime!"
    });
    onComplete('free');
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-3 sm:mb-4">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6 px-4">
            Select the perfect plan to enhance your dating experience
          </p>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground text-sm sm:text-base"
          >
            I'll skip this time →
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg lg:hover:-translate-y-1 ${plan.color} ${
                selectedPlan === plan.id ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground text-xs sm:text-sm">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center p-4 sm:p-6">
                <div className="flex justify-center mb-3 sm:mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">{plan.name}</CardTitle>
                <div className="text-2xl sm:text-3xl font-bold">
                  {plan.price}
                  <span className="text-base sm:text-lg font-normal text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <ul className="space-y-2 sm:space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-left">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full h-12 sm:h-12 text-sm sm:text-base font-medium ${plan.id === 'free' ? 'bg-gray-600 hover:bg-gray-700' : plan.id === 'basic' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlanSelect(plan.id);
                  }}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6 sm:mt-8 space-y-2 px-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            ✨ All plans include basic matching and messaging
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            💝 No commitment • Cancel anytime • Upgrade or downgrade easily
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSelectionPage;