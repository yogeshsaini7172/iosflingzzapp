import React, { useEffect, useState } from 'react';
import HeartAnimation from '@/components/ui/HeartAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import { SUBSCRIPTION_PLANS, type PlanId } from '@/config/subscriptionPlans';

type UiPlan = { id: string; name: string; amount: number; description?: string };

// Build UI plans from the single source of truth
const PLANS: UiPlan[] = Object.values(SUBSCRIPTION_PLANS).map((p) => ({ id: p.id, name: p.display_name, amount: p.price_monthly_inr, description: p.display_name }));

// Use Vite env variables (must be prefixed with VITE_ in .env files)
const rawFunctionsBase = (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string) || (import.meta.env.VITE_SUPABASE_URL as string) || 'https://<project>.supabase.co';
// Ensure we call the Edge Functions path; if user supplied the project root, append /functions/v1
const FUNCTIONS_BASE = rawFunctionsBase.includes('/functions') ? rawFunctionsBase : rawFunctionsBase.replace(/\/$/, '') + '/functions/v1';
const RAZORPAY_KEY = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || (import.meta.env.VITE_RAZORPAY_KEY as string) || undefined;

const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ plan: string; amount: number; paymentId: string } | null>(null);

  useEffect(() => {
    // Load Razorpay SDK if not present
    if (typeof window !== 'undefined' && !(window as unknown as { Razorpay?: unknown }).Razorpay) {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const handlePayment = async (plan: UiPlan) => {
    setPaymentError('');
    setPaymentSuccess(false);
    setLoadingPlan(plan.name);

    if (!user) {
      setPaymentError('Please sign in to purchase a plan.');
      setLoadingPlan('');
      return;
    }
    if (!RAZORPAY_KEY) {
      setPaymentError('Payment configuration missing on client. Please set VITE_RAZORPAY_KEY_ID in your .env file and restart the dev server.');
      setLoadingPlan('');
      return;
    }

    try {
      const url = `${FUNCTIONS_BASE}/create-subscription-order`;
      const createResp = await fetchWithFirebaseAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.amount, currency: 'INR', receipt: `receipt_${plan.id}_${Date.now()}`, plan: plan.id })
      });

      if (!createResp.ok) {
        const err = await createResp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create order');
      }

      const createData: { orderId: string; amount: number; currency: string; subscriptionId: string } = await createResp.json();

      type RazorpayHandlerResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
      type RazorpayOptions = {
        key: string | undefined;
        amount: number;
        currency: string;
        name: string;
        description: string;
        order_id: string;
        prefill?: { email?: string };
        theme?: { color?: string };
        handler: (response: RazorpayHandlerResponse) => Promise<void> | void;
      };

      const options: RazorpayOptions = {
        key: RAZORPAY_KEY,
        amount: createData.amount,
        currency: createData.currency,
        name: 'Flingzz Subscription',
        description: `Payment for ${plan.name} plan`,
        order_id: createData.orderId,
        prefill: { email: user.email },
        theme: { color: '#6366f1' },
        handler: async (response: RazorpayHandlerResponse) => {
          try {
            const verifyUrl = `${FUNCTIONS_BASE}/verify-subscription-payment`;
            const verifyResp = await fetchWithFirebaseAuth(verifyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpay_payment_id: response.razorpay_payment_id, razorpay_order_id: response.razorpay_order_id, razorpay_signature: response.razorpay_signature, subscriptionId: createData.subscriptionId })
            });

            const verifyData = await verifyResp.json();
            if (verifyResp.ok && verifyData.success) {
              setPaymentSuccess(true);
              setSuccessDetails({ plan: plan.name, amount: plan.amount, paymentId: response.razorpay_payment_id });
              toast({ title: 'Payment successful', description: 'Subscription activated.' });
            } else {
              const err = verifyData.error || 'Payment verification failed';
              setPaymentError(err);
              toast({ title: 'Payment error', description: err, variant: 'destructive' });
            }
          } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message : String(err);
            setPaymentError(msg || 'Verification request failed');
            toast({ title: 'Payment error', description: msg || 'Verification request failed', variant: 'destructive' });
          } finally {
            setLoadingPlan('');
          }
        }
      };

  // Access Razorpay from window with a typed constructor
  type RazorpayConstructor = new (opts: RazorpayOptions) => { open: () => void };
  const RazorpayCtor = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (!RazorpayCtor) throw new Error('Razorpay checkout SDK not loaded');
  const rzp = new RazorpayCtor(options);
      rzp.open();
    } catch (err: unknown) {
      console.error('Payment flow error', err);
      const message = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message : String(err);
      setPaymentError(message || 'An unknown error occurred');
      setLoadingPlan('');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Choose a plan</h2>

      {paymentSuccess && successDetails && (
        <div className="bg-success/90 text-white p-4 rounded mb-4">
          <div>Payment successful!</div>
          <div>Plan: {successDetails.plan}</div>
          <div>Amount: ₹{successDetails.amount}</div>
        </div>
      )}

      {paymentError && (
        <div className="bg-red-600 text-white p-4 rounded mb-4">{paymentError}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div key={plan.name} className="bg-card p-6 rounded shadow">
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            <p className="text-muted-foreground">{plan.description}</p>
            <div className="my-3 text-2xl">₹{plan.amount}</div>
            <button
              disabled={loadingPlan === plan.name}
              onClick={() => handlePayment(plan)}
              className="w-full py-2 bg-gradient-primary text-white rounded"
            >
              {loadingPlan === plan.name ? 'Processing...' : `Choose ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage;