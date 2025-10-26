import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, Crown, CreditCard, Shield } from "lucide-react";
import Loader from '@/components/ui/Loader';
import { useToast } from "@/hooks/use-toast";

interface CheckoutPageProps {
  selectedPlan: 'premium' | 'elite';
  onBack: () => void;
  onSuccess: () => void;
}

const CheckoutPage = ({ selectedPlan, onBack, onSuccess }: CheckoutPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const planDetails = {
    premium: {
      name: "Premium Plan",
      price: "₹299",
      period: "per month",
      features: [
        "Unlimited swipes per day",
        "Priority visibility in feeds", 
        'See "Who Liked Me"',
        "Advanced filters",
        "1 free profile boost per week",
        "Premium chat features",
        "Read receipts"
      ]
    },
    elite: {
      name: "Elite Plan", 
      price: "₹599",
      period: "per month",
      features: [
        "Everything in Premium",
        "Unlimited profile boosts",
        "Incognito mode",
        "Direct messaging without matches",
        "Exclusive events & communities",
        "Priority customer support",
        "Early access to new features"
      ]
    }
  };

  const plan = planDetails[selectedPlan];

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment Successful! 🎉",
        description: `Welcome to ${plan.name}! Your subscription is now active.`
      });
      
      // Simulate successful payment
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-elegant bg-gradient-card backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="rounded-full w-10 h-10 p-0 hover:bg-primary/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Badge className="bg-success text-success-foreground">
                <Shield className="w-3 h-3 mr-1" />
                Secure Checkout
              </Badge>
              <div className="w-10" />
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
                Complete Your Upgrade
              </CardTitle>
              <CardDescription>
                Join thousands of students finding meaningful connections
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Plan Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{plan.price}</div>
                    <div className="text-sm text-muted-foreground">{plan.period}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Check className="w-4 h-4 text-success" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <div className="text-sm text-muted-foreground">
                    +{plan.features.length - 3} more features
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <div className="space-y-3">
              <h4 className="font-medium">Payment Method</h4>
              <Card className="border-2 border-primary cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">Credit/Debit Card</div>
                      <div className="text-sm text-muted-foreground">Secure payment via Stripe</div>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary"></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>{plan.price}/month</span>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader size={12} className="inline-block" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Pay {plan.price} - Start Premium</span>
                </div>
              )}
            </Button>

            {/* Security Note */}
            <div className="text-center text-xs text-muted-foreground">
              <Shield className="w-3 h-3 inline mr-1" />
              Your payment information is secure and encrypted
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;