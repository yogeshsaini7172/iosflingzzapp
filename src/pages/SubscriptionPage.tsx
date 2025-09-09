import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Heart, ArrowLeft, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

interface SubscriptionPageProps {
  onNavigate: (view: string) => void;
}

const SubscriptionPage = ({ onNavigate }: SubscriptionPageProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'forever',
      description: 'Basic features to get started',
      features: [
        '20 daily swipes',
        'Basic matching',
        'Limited chat requests',
        'Standard profile visibility'
      ],
      color: 'border-border',
      popular: false,
      icon: Heart
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      interval: 'month',
      description: 'Enhanced matching experience',
      features: [
        'Unlimited swipes',
        'Advanced AI matching',
        'Priority profile visibility',
        'See who liked you',
        'Unlimited chat requests',
        'Premium badges',
        'Advanced filters'
      ],
      color: 'border-primary',
      popular: true,
      icon: Zap
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 39.99,
      interval: 'month',
      description: 'Ultimate dating experience',
      features: [
        'Everything in Premium',
        'VIP profile boost',
        'Exclusive match suggestions',
        'Personal compatibility coach',
        'Read receipts',
        'Priority customer support',
        'Elite member badge'
      ],
      color: 'border-amber-500',
      popular: false,
      icon: Crown
    }
  ];

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    try {
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (planId === 'free') {
        toast.success('You\'re already on the free plan!');
      } else {
        toast.success(`Successfully subscribed to ${plans.find(p => p.id === planId)?.name} plan!`);
      }
    } catch (error) {
      toast.error('Subscription failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UnifiedLayout title="Subscription Plans">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('profile')}
            className="mb-4 hover:bg-muted/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-elegant font-bold text-gradient-primary mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Unlock premium features and find your perfect match faster
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-200 hover:shadow-xl ${
                  selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                } ${plan.color} ${
                  plan.popular ? 'scale-105 shadow-lg' : ''
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-white px-6 py-1">
                      <Crown className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="flex items-center justify-center mb-4">
                    <IconComponent className={`w-8 h-8 ${
                      plan.id === 'free' ? 'text-muted-foreground' :
                      plan.id === 'premium' ? 'text-primary' :
                      'text-amber-500'
                    }`} />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/{plan.interval}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="pt-2">
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-primary hover:opacity-90' 
                        : plan.id === 'elite'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                          : ''
                    }`}
                    variant={plan.id === 'free' ? 'outline' : 'default'}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    {plan.id === 'free' ? 'Current Plan' : `Subscribe to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8">Why upgrade to Premium?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Better Matches</h3>
              <p className="text-muted-foreground text-sm">
                AI-powered compatibility scoring finds your perfect match
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Unlimited Access</h3>
              <p className="text-muted-foreground text-sm">
                No limits on swipes, likes, or conversations
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Premium Features</h3>
              <p className="text-muted-foreground text-sm">
                Exclusive features and priority support
              </p>
            </div>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default SubscriptionPage;