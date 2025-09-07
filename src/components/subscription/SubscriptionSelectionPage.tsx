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
      icon: <Zap className="w-6 h-6 text-blue-500" />,
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
      color: 'border-blue-200 bg-blue-50/50'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99',
      period: '/month',
      description: 'Ultimate dating experience',
      icon: <Crown className="w-6 h-6 text-purple-500" />,
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
      color: 'border-purple-200 bg-purple-50/50'
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Select the perfect plan to enhance your dating experience
          </p>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            I'll skip this time →
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${plan.color} ${
                selectedPlan === plan.id ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-lg font-normal text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full h-12 ${plan.id === 'free' ? 'bg-gray-600 hover:bg-gray-700' : plan.id === 'basic' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
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

        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            ✨ All plans include basic matching and messaging
          </p>
          <p className="text-sm text-muted-foreground">
            💝 No commitment • Cancel anytime • Upgrade or downgrade easily
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSelectionPage;