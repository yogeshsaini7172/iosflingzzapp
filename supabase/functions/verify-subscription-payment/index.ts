import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-firebase-token',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, subscriptionId } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !subscriptionId) {
      throw new Error('Missing required payment verification parameters');
    }

    // Get Razorpay secret
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(razorpayKeySecret);
    const messageData = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const generatedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (generatedSignature !== razorpay_signature) {
      console.error('Payment verification failed: Invalid signature');
      throw new Error('Invalid payment signature');
    }

    // Get subscription record
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('Subscription not found:', subError);
      throw new Error('Subscription record not found');
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // Update subscription status
    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'active',
        razorpay_payment_id: razorpay_payment_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      throw new Error('Failed to update subscription');
    }

    // Update user profile with subscription - use the DB function
    const { data: updateResult, error: profileError } = await supabaseClient
      .rpc('update_user_subscription', {
        p_user_id: subscription.user_id,
        p_plan: subscription.plan,
        p_tier: subscription.plan.split('_')[0], // Extract tier from plan (e.g., 'basic' from 'basic_69')
        p_end_date: endDate.toISOString()
      });

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      // Don't fail the payment, just log the error
    }

    console.log(`[PAYMENT] Payment verified for user ${subscription.user_id}, plan: ${subscription.plan}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment verified successfully',
      subscription: {
        id: subscriptionId,
        plan: subscription.plan,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Verify payment error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Payment verification failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
