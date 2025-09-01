import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlansProps {
  onSubscribe: (tier: string) => void;
  currentTier?: string;
}

const SubscriptionPlans = ({ onSubscribe, currentTier = 'free' }: SubscriptionPlansProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '₹49',
      period: '/month',
      icon: Sparkles,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      features: [
        'Unlimited swipes',
        'See who liked you',
        '1 Blind date per month',
        'Enhanced filters',
        'No ads',
        'Basic analytics'
      ],
      popular: false
    },
    {
      id: 'plus',
      name: 'Plus',
      price: '₹89',
      period: '/month',
      icon: Crown,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      features: [
        'Everything in Starter',
        '10 Blind dates per month',
        '5 Super likes daily',
        'Advanced compatibility insights',
        'Message read receipts',
        'Priority customer support',
        'Profile boost (2x visibility)'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹159',
      period: '/month',
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      features: [
        'Everything in Plus',
        'Unlimited Blind dates',
        'Unlimited Super likes',
        'See who viewed your profile',
        'Invisible browsing mode',
        'Advanced matching algorithm',
        'Profile boost (5x visibility)',
        'Verified badge priority',
        'Premium customer support'
      ],
      popular: false
    }
  ];

  const handleSubscribe = async (planId: string) => {
    setIsLoading(planId);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Subscription Activated!",
      description: `Welcome to CampusConnect ${planId.charAt(0).toUpperCase() + planId.slice(1)}!`,
    });

    onSubscribe(planId);
    setIsLoading(null);
  };

  return (
    <div className="min-h-screen bg-gradient-soft py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features and find your perfect match faster with our subscription plans.
          </p>
        </div>

        {/* Current Plan Badge */}
        {currentTier !== 'free' && (
          <div className="text-center mb-8">
            <Badge variant="default" className="text-base px-4 py-2">
              Current Plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
            </Badge>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentTier === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  plan.popular ? 'border-primary shadow-medium scale-105' : ''
                } ${isCurrentPlan ? 'bg-emerald-50 border-emerald-200' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0">
                    <div className="bg-primary text-primary-foreground text-sm font-semibold text-center py-2">
                      Most Popular
                    </div>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0">
                    <div className="bg-emerald-500 text-white text-sm font-semibold text-center py-2">
                      Current Plan
                    </div>
                  </div>
                )}

                <CardHeader className={`text-center ${plan.popular || isCurrentPlan ? 'pt-12' : 'pt-6'}`}>
                  <div className={`${plan.bgColor} ${plan.borderColor} border w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`h-8 w-8 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading === plan.id || isCurrentPlan}
                  >
                    {isLoading === plan.id ? (
                      "Processing..."
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
            <CardDescription>Compare all features across our plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Features</th>
                    <th className="text-center py-3 px-2">Free</th>
                    <th className="text-center py-3 px-2">Starter</th>
                    <th className="text-center py-3 px-2">Plus</th>
                    <th className="text-center py-3 px-2">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-3 px-2">Daily swipes</td>
                    <td className="text-center py-3 px-2">10</td>
                    <td className="text-center py-3 px-2">Unlimited</td>
                    <td className="text-center py-3 px-2">Unlimited</td>
                    <td className="text-center py-3 px-2">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">Super likes</td>
                    <td className="text-center py-3 px-2">0</td>
                    <td className="text-center py-3 px-2">1/day</td>
                    <td className="text-center py-3 px-2">5/day</td>
                    <td className="text-center py-3 px-2">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">Blind dates</td>
                    <td className="text-center py-3 px-2">0</td>
                    <td className="text-center py-3 px-2">1/month</td>
                    <td className="text-center py-3 px-2">10/month</td>
                    <td className="text-center py-3 px-2">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">See who liked you</td>
                    <td className="text-center py-3 px-2">❌</td>
                    <td className="text-center py-3 px-2">✅</td>
                    <td className="text-center py-3 px-2">✅</td>
                    <td className="text-center py-3 px-2">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">Profile boost</td>
                    <td className="text-center py-3 px-2">❌</td>
                    <td className="text-center py-3 px-2">❌</td>
                    <td className="text-center py-3 px-2">2x</td>
                    <td className="text-center py-3 px-2">5x</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-sm text-muted-foreground">Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">We accept all major credit cards, debit cards, UPI, and net banking through secure payment gateways.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Is my data secure?</h4>
              <p className="text-sm text-muted-foreground">Absolutely. We use bank-level encryption and never share your personal information with third parties.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPlans;