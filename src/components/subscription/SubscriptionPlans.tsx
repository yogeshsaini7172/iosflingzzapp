import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Gem, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_PLANS, type PlanId } from "@/config/subscriptionPlans";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";

interface SubscriptionPlansProps {
  currentPlan?: PlanId;
  onPlanSelect?: (plan: PlanId) => void;
  showCurrentPlan?: boolean;
  onSkip?: () => void;
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

const SubscriptionPlans = ({ 
  currentPlan = 'free', 
  onPlanSelect,
  showCurrentPlan = true,
  onSkip 
}: SubscriptionPlansProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Load Razorpay SDK
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Create display plans from configuration
  const plans = [
    {
      id: 'free' as const,
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Basic dating features to get started',
      icon: <Star className="w-6 h-6" />,
      color: 'border-gray-400',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      features: [
        '20 daily swipes',
        '1 profile shown in feed',
        'Basic matching'
      ]
    },
    {
      id: 'basic_69' as const,
      name: SUBSCRIPTION_PLANS.basic_69.display_name,
      price: `₹${SUBSCRIPTION_PLANS.basic_69.price_monthly_inr}`,
      period: 'per month',
      description: 'Enhanced features for better connections',
      icon: <Crown className="w-6 h-6" />,
      color: 'border-blue-400',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      features: [
        '50 daily swipes',
        '10 profiles shown in feed',
        'See who liked you',
        '1 boost per month',
        'Request extra pairings'
      ]
    },
    {
      id: 'standard_129' as const,
      name: SUBSCRIPTION_PLANS.standard_129.display_name,
      price: `₹${SUBSCRIPTION_PLANS.standard_129.price_monthly_inr}`,
      period: 'per month',
      description: 'Unlimited swiping with premium features',
      icon: <Zap className="w-6 h-6" />,
      color: 'border-yellow-400',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      popular: true,
      features: [
        'Unlimited swipes',
        '10 profiles shown in feed',
        'See who liked you',
        '2 boosts per month',
        '2 superlikes per month',
        'Request extra pairings'
      ]
    },
    {
      id: 'premium_243' as const,
      name: SUBSCRIPTION_PLANS.premium_243.display_name,
      price: `₹${SUBSCRIPTION_PLANS.premium_243.price_monthly_inr}`,
      period: 'per month',
      description: 'Ultimate premium experience with AI insights',
      icon: <Gem className="w-6 h-6" />,
      color: 'border-purple-400',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      features: [
        'Unlimited swipes',
        '10 profiles shown in feed',
        'See who liked you',
        '30 boosts per month',
        'Unlimited superlikes',
        'Priority matching',
        'AI compatibility insights',
        'Request extra pairings'
      ]
    }
  ];

  const handlePlanSelect = async (planId: PlanId) => {
    try {
      setIsLoading(true);
      
      if (planId === 'free') {
        toast({
          title: "Free plan selected",
          description: "You can upgrade anytime for premium features!"
        });
        onPlanSelect?.(planId);
        return;
      }

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan",
          variant: "destructive"
        });
        return;
      }

      if (!RAZORPAY_KEY) {
        toast({
          title: "Payment not configured",
          description: "Payment gateway is not configured. Contact support.",
          variant: "destructive"
        });
        return;
      }

      // Create order via edge function
      const plan = SUBSCRIPTION_PLANS[planId];
      const amount = plan.price_monthly_inr;
      
      const createOrderResponse = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/create-subscription-order',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency: 'INR',
            receipt: `sub_${Date.now()}`,
            plan: planId
          })
        }
      );

      if (!createOrderResponse.ok) {
        const errorText = await createOrderResponse.text();
        throw new Error(`Failed to create order: ${errorText}`);
      }

      const orderData = await createOrderResponse.json();
      console.log('Order created:', orderData);

      // Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'GradSync',
        description: `${plan.display_name} Subscription`,
        prefill: {
          email: user.email || ''
        },
        theme: {
          color: '#6366f1'
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch(
              'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/verify-subscription-payment',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  subscriptionId: orderData.subscriptionId
                })
              }
            );

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              toast({
                title: "Payment successful! 🎉",
                description: `${plan.display_name} plan activated`
              });
              onPlanSelect?.(planId);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (err: any) {
            console.error('Payment verification error:', err);
            toast({
              title: "Payment verification failed",
              description: err.message || "Please contact support",
              variant: "destructive"
            });
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast({
              title: "Payment cancelled",
              description: "You can try again anytime"
            });
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      setIsLoading(false); // Reset loading when modal opens

    } catch (error: any) {
      console.error('Error selecting plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive"
      });
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative transition-all duration-300 hover:shadow-elegant ${
              plan.popular ? 'ring-2 ring-primary scale-105 border-primary/50' : 'border-border/30'
            } ${currentPlan === plan.id && showCurrentPlan ? 'bg-card/80 backdrop-blur-md' : 'bg-card/60 backdrop-blur-sm'}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground font-display font-semibold">
                Most Popular
              </Badge>
            )}
            
            {currentPlan === plan.id && showCurrentPlan && (
              <Badge className="absolute -top-3 right-4 bg-success text-success-foreground font-professional">
                Current Plan
              </Badge>
            )}

            <CardHeader className="text-center px-4 py-6">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${plan.bgColor} shadow-soft`}>
                <span className={plan.textColor}>
                  {plan.icon}
                </span>
              </div>
              
              <CardTitle className="text-lg sm:text-xl font-display font-bold text-foreground">{plan.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm font-professional text-muted-foreground">{plan.description}</CardDescription>
              
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-display font-bold text-primary">
                  {plan.price}
                </div>
                <div className="text-xs sm:text-sm font-professional text-muted-foreground">{plan.period}</div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 px-4 pb-6">
              <div className="space-y-2 sm:space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-professional text-muted-foreground leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handlePlanSelect(plan.id)}
                disabled={isLoading || (currentPlan === plan.id && showCurrentPlan)}
                className={`w-full font-professional font-semibold text-sm sm:text-base py-2.5 rounded-xl transition-all duration-300 ${
                  plan.id === 'free' ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:shadow-glow' :
                  plan.id === 'basic_69' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-glow' :
                  plan.id === 'standard_129' ? 'bg-gradient-primary hover:shadow-glow' :
                  plan.id === 'premium_243' ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-glow' :
                  'bg-card border border-border hover:bg-card/80 text-muted-foreground'
                }`}
                variant="default"
              >
              {currentPlan === plan.id && showCurrentPlan ? 
                'Current Plan' : 
                'Choose Plan'
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