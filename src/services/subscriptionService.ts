import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import { getPlanPrice } from '@/config/subscriptionPlans';

/**
 * Service for handling subscription payments and management
 */

// Declare Razorpay type
declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Create a subscription order through Razorpay
 */
export async function createSubscriptionOrder(planId: string) {
  try {
    const amount = getPlanPrice(planId);
    
    if (!amount || amount <= 0) {
      throw new Error('Invalid plan or amount');
    }

    const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/create-subscription-order', {
      method: 'POST',
      body: JSON.stringify({
        plan: planId,
        amount: amount,
        currency: 'INR',
        receipt: `sub_${Date.now()}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create subscription order');
    }

    const data = await response.json();
    return {
      success: true,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
      subscriptionId: data.subscriptionId
    };
  } catch (error) {
    console.error('Create subscription order error:', error);
    throw error;
  }
}

/**
 * Verify subscription payment after Razorpay checkout
 */
export async function verifySubscriptionPayment(
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
  subscriptionId: string
) {
  try {
    const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/verify-subscription-payment', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
        subscriptionId: subscriptionId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Payment verification failed');
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message
    };
  } catch (error) {
    console.error('Verify payment error:', error);
    throw error;
  }
}

/**
 * Initialize Razorpay checkout for subscription
 */
export async function initiateSubscriptionPayment(
  planId: string,
  onSuccess: (paymentData: any) => void,
  onFailure: (error: any) => void
) {
  try {
    console.log('🚀 Initiating payment for plan:', planId);
    
    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      console.log('📦 Loading Razorpay script...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('✅ Razorpay script loaded');
          resolve(true);
        };
        script.onerror = () => {
          console.error('❌ Failed to load Razorpay script');
          reject(new Error('Failed to load payment gateway'));
        };
      });
    }

    // Create order
    console.log('📝 Creating subscription order...');
    const orderData = await createSubscriptionOrder(planId);
    console.log('✅ Order created:', orderData);

    // Get Razorpay key from environment
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    
    if (!razorpayKey) {
      console.error('❌ Razorpay key not configured');
      throw new Error('Payment gateway not configured. Please contact support.');
    }

    // Initialize Razorpay checkout
    const options = {
      key: razorpayKey,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'FLINGZZ',
      description: `${planId.replace('_', ' ').toUpperCase()} Subscription`,
      order_id: orderData.orderId,
      handler: async function (response: any) {
        try {
          console.log('✅ Payment completed, verifying...');
          
          // Verify payment on backend
          await verifySubscriptionPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
            orderData.subscriptionId
          );
          
          console.log('✅ Payment verified successfully');
          
          onSuccess({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            subscriptionId: orderData.subscriptionId
          });
        } catch (error) {
          console.error('❌ Payment verification failed:', error);
          onFailure(error);
        }
      },
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#8B5CF6' // Primary color
      },
      modal: {
        ondismiss: function() {
          console.log('❌ Payment cancelled by user');
          onFailure(new Error('Payment cancelled by user'));
        }
      }
    };

    console.log('💳 Opening Razorpay checkout...');
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('❌ Initiate payment error:', error);
    onFailure(error);
  }
}

/**
 * Get user's current subscription status
 */
export async function getUserSubscription() {
  try {
    const response = await fetchWithFirebaseAuth('/functions/v1/subscription-entitlement', {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get subscription error:', error);
    return null;
  }
}
