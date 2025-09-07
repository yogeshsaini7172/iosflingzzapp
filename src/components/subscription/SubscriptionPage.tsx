import { useState } from "react";
import GenZBackground from '@/components/ui/genZ-background';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Crown, 
  Zap, 
  Heart,
  Users,
  Sparkles,
  Shield,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPageProps {
  onNavigate: (view: string) => void;
}

const SubscriptionPage = ({ onNavigate }: SubscriptionPageProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'plus' | 'pro' | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '₹49',
      period: '/month',
      description: 'Ad-free experience with essential features',
      features: [
        'Ad-free experience',
        'Limited daily swipes',
        '1 profile boost per month'
      ],
      icon: Heart,
      popular: false,
      gradient: 'from-primary to-secondary'
    },
    {
      id: 'plus',
      name: 'Plus Plan',
      price: '₹89',
      period: '/month',
      description: 'Enhanced features for better connections',
      features: [
        'Everything in Basic',
        'Extra daily swipes',
        'See who liked you',
        '2 profile boosts per month',
        '2 superlikes per month'
      ],
      icon: Crown,
      popular: true,
      gradient: 'from-accent to-primary'
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '₹129',
      period: '/month',
      description: 'Ultimate premium experience',
      features: [
        'Everything in Plus',
        'Unlimited swipes',
        'Daily profile boost',
        'Unlimited superlikes',
        'Priority matching (your profile is shown first)',
        'AI match insights for better compatibility'
      ],
      icon: Zap,
      popular: false,
      gradient: 'from-secondary to-accent'
    }
  ];

  const handleSubscribe = async (planId: 'basic' | 'plus' | 'pro') => {
    setSelectedPlan(planId);
    setLoading(true);

    try {
      // For now, show success message since Stripe isn't set up yet
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast({
        title: "Subscription activated! 🎉",
        description: `You've successfully subscribed to the ${planId} plan.`,
      });

      // Store subscription in localStorage for demo
      localStorage.setItem('subscription_plan', planId);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <GenZBackground variant="app">
      <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card/60 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onNavigate('home')}
            className="text-foreground hover:text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-display font-bold text-foreground">Subscription Plans</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <Card className="text-center p-6 bg-gradient-primary text-primary-foreground border-0 shadow-glow">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold mb-2">Unlock Premium Features</h2>
              <p className="text-white/90">
                Find your perfect match with enhanced features and priority access
              </p>
            </div>
          </div>
        </Card>

        {/* Plans */}
        <div className="space-y-4">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isLoading = loading && selectedPlan === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden border-2 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-purple-300 bg-white/90 shadow-lg' 
                    : 'border-rose-200 bg-white/80'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-500 text-white text-center py-2">
                      <Badge className="bg-white/20 text-white border-0 text-xs font-semibold">
                        MOST POPULAR
                      </Badge>
                    </div>
                  </div>
                )}

                <CardHeader className={`${plan.popular ? 'pt-12' : 'pt-6'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${plan.gradient} rounded-full flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-rose-700">{plan.name}</CardTitle>
                        <p className="text-sm text-rose-500">{plan.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-rose-700">{plan.price}</div>
                      <div className="text-sm text-rose-500">{plan.period}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-rose-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id as 'basic' | 'plus' | 'pro')}
                    disabled={loading}
                    className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white shadow-lg font-semibold`}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Activating...</span>
                      </div>
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
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-rose-200/50">
          <h3 className="font-semibold text-rose-700 mb-4">Why upgrade?</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-rose-600">Faster matches</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-rose-600">Priority verification</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-rose-600">More connections</span>
            </div>
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-purple-500" />
              <span className="text-rose-600">Exclusive features</span>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </GenZBackground>
  );
};

export default SubscriptionPage;