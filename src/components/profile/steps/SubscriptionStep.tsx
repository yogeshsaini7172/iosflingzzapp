import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Sparkles, Loader2 } from "lucide-react";
import { SUBSCRIPTION_PLANS, type PlanId } from "@/config/subscriptionPlans";
import { useToast } from "@/hooks/use-toast";
import { initiateSubscriptionPayment } from "@/services/subscriptionService";

interface SubscriptionStepProps {
  onPlanSelect: (planId: PlanId) => void;
}

const SubscriptionStep = ({ onPlanSelect }: SubscriptionStepProps) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentPlanId, setPaymentPlanId] = useState<PlanId | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: 'basic_69' as PlanId,
      name: SUBSCRIPTION_PLANS.basic_69.display_name,
      price: `₹${SUBSCRIPTION_PLANS.basic_69.price_monthly_inr}`,
      period: '/month',
      description: 'Essential features for meaningful connections',
      icon: Zap,
      gradient: 'from-blue-500 to-cyan-500',
      features: [
        '100 daily swipes',
        '5 pairing requests per day',
        'See who liked you',
        '1 profile boost per month',
        'Enhanced visibility'
      ]
    },
    {
      id: 'standard_129' as PlanId,
      name: SUBSCRIPTION_PLANS.standard_129.display_name,
      price: `₹${SUBSCRIPTION_PLANS.standard_129.price_monthly_inr}`,
      period: '/month',
      description: 'Enhanced features for better matches',
      icon: Crown,
      gradient: 'from-purple-500 to-pink-500',
      popular: true,
      features: [
        'Unlimited swipes',
        '10 pairing requests per day',
        'See who liked you',
        '2 profile boosts per month',
        '2 superlikes per month',
        'Premium visibility'
      ]
    },
    {
      id: 'premium_243' as PlanId,
      name: SUBSCRIPTION_PLANS.premium_243.display_name,
      price: `₹${SUBSCRIPTION_PLANS.premium_243.price_monthly_inr}`,
      period: '/month',
      description: 'Ultimate dating experience',
      icon: Sparkles,
      gradient: 'from-amber-500 to-orange-500',
      features: [
        'Unlimited swipes',
        '20 pairing requests per day',
        'See who liked you',
        '30 profile boosts per month',
        'Unlimited superlikes',
        'Priority matching',
        'AI compatibility insights',
        'VIP support'
      ]
    }
  ];

  const handleSelectPlan = async (planId: PlanId) => {
    setSelectedPlan(planId);
    setPaymentPlanId(planId);
    setProcessingPayment(true);

    try {
      toast({
        title: "Opening Payment Gateway... 💳",
        description: "Please complete your payment to activate your subscription"
      });

      // Initiate Razorpay payment
      await initiateSubscriptionPayment(
        planId,
        (paymentData) => {
          // Payment successful
          console.log('Payment successful:', paymentData);
          setProcessingPayment(false);
          setPaymentCompleted(true);
          
          toast({
            title: "Payment Successful! 🎉",
            description: `Your ${SUBSCRIPTION_PLANS[planId].display_name} plan is now active!`
          });

          // Notify parent component
          onPlanSelect(planId);
        },
        (error) => {
          // Payment failed or cancelled
          console.error('Payment failed:', error);
          setProcessingPayment(false);
          setPaymentPlanId(null);
          
          toast({
            title: "Payment Failed",
            description: error.message || "Please try again or select a different plan",
            variant: "destructive"
          });
        }
      );
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      setProcessingPayment(false);
      setPaymentPlanId(null);
      
      toast({
        title: "Payment Error",
        description: error.message || "Unable to process payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-white">Choose Your Experience</h3>
        <p className="text-white/70">Select a plan and complete payment to continue</p>
        <div className="flex items-center justify-center gap-2 text-sm text-white/60 mt-2">
          <span>🔒 Secure payment via Razorpay</span>
          <span>•</span>
          <span>💳 All major cards accepted</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const IconComponent = plan.icon;
          const isSelected = selectedPlan === plan.id;
          
          return (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 border-2 bg-black/40 backdrop-blur-sm ${
                isSelected 
                  ? 'border-primary shadow-lg scale-105' 
                  : plan.popular
                  ? 'border-purple-500/50 hover:border-purple-500'
                  : 'border-white/10 hover:border-white/30'
              }`}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-white">
                  {plan.price}
                  <span className="text-sm font-normal text-white/60">{plan.period}</span>
                </div>
                <p className="text-sm text-white/70">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                  disabled={processingPayment}
                >
                  {processingPayment && paymentPlanId === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isSelected ? (
                    'Selected ✓'
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {processingPayment && (
        <div className="text-center p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Processing your payment...</span>
          </div>
          <p className="text-sm text-white/70 mt-2">
            Please complete the payment in the Razorpay window
          </p>
        </div>
      )}

      {selectedPlan && paymentCompleted && (
        <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-medium">Payment Successful!</span>
          </div>
          <p className="text-sm text-white/70 mt-2">
            Your subscription is active. Click "Next" to complete your profile.
          </p>
        </div>
      )}

      <div className="text-center text-sm text-white/60 space-y-1">
        <p>✨ All plans include basic matching and messaging</p>
        <p>💝 Cancel anytime • Upgrade or downgrade easily</p>
        <p>🔒 Secure payment processing via Razorpay</p>
      </div>
    </div>
  );
};

export default SubscriptionStep;
