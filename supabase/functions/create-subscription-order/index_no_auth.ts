// TEMPORARY VERSION WITHOUT FIREBASE AUTH - FOR TESTING ONLY
// Copy this to Supabase Dashboard to test if auth is the problem

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

declare const Deno: any;

function buildCorsHeaders(reqOrOrigin?: Request | string) {
  let origin = '*';
  if (typeof reqOrOrigin === 'string') {
    origin = reqOrOrigin;
  } else if (reqOrOrigin && typeof (reqOrOrigin as Request).headers?.get === 'function') {
    origin = (reqOrOrigin as Request).headers.get('origin') || (Deno?.env?.get('CLIENT_URL') ?? '*');
  } else {
    origin = (typeof Deno !== 'undefined' && Deno.env?.get('CLIENT_URL')) || '*';
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-firebase-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '600'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received');
    return new Response(null, { status: 204, headers: buildCorsHeaders(req) });
  }

  console.log('POST request received');

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', 
      { auth: { persistSession: false } }
    );

    // TEMPORARY: Skip Firebase auth verification for testing
    // Read Firebase token from custom header (Authorization has Supabase anon key)
    const firebaseToken = req.headers.get('x-firebase-token') || '';
    console.log('Firebase token present:', !!firebaseToken);
    
    // Extract user ID from token WITHOUT verification (TESTING ONLY)
    let firebaseUid = 'test-user-id';
    if (firebaseToken) {
      try {
        const parts = firebaseToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          firebaseUid = payload.sub || payload.user_id || 'test-user-id';
          console.log('Extracted UID from token:', firebaseUid);
        }
      } catch (e) {
        console.log('Could not decode token, using test-user-id');
      }
    }

    const body = await req.json();
    console.log('Request body:', { plan: body.plan, amount: body.amount });
    
    const amount = Number(body.amount || 0);
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `rcpt_${Date.now()}`;
    const plan = body.plan || 'unknown';

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount);
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }), 
        { 
          status: 400, 
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call Razorpay REST API to create order
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    console.log('Razorpay keys configured:', { keyId: !!keyId, keySecret: !!keySecret });
    
    if (!keyId || !keySecret) {
      console.error('Razorpay keys not configured');
      return new Response(
        JSON.stringify({ error: 'Razorpay keys not configured' }), 
        { 
          status: 500, 
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      );
    }

    const orderPayload = { 
      amount: Math.round(amount * 100), 
      currency, 
      receipt, 
      payment_capture: 1 
    };
    
    console.log('Creating Razorpay order:', orderPayload);
    
    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Basic ${basicAuth}` 
      }, 
      body: JSON.stringify(orderPayload)
    });

    if (!rpRes.ok) {
      const txt = await rpRes.text();
      console.error('Razorpay create order failed:', txt);
      return new Response(
        JSON.stringify({ error: 'Razorpay error', details: txt }), 
        { 
          status: 502, 
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      );
    }

    const order = await rpRes.json();
    console.log('Razorpay order created:', order.id);

    const subscriptionId = crypto.randomUUID();
    console.log('Inserting subscription:', subscriptionId);
    
    const insert = await supabaseAdmin.from('subscriptions').insert([{ 
      id: subscriptionId, 
      user_id: firebaseUid, 
      plan, 
      start_date: new Date().toISOString(), 
      is_active: false, 
      razorpay_order_id: order.id 
    }]);
    
    if (insert.error) {
      console.error('Insert subscription error:', insert.error.message || insert.error);
    } else {
      console.log('Subscription inserted successfully');
    }

    const response = { 
      success: true, 
      orderId: order.id, 
      amount: order.amount, 
      currency: order.currency, 
      subscriptionId 
    };
    
    console.log('Returning success response:', response);

    return new Response(
      JSON.stringify(response), 
      { 
        headers: { 
          ...buildCorsHeaders(req), 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (err) {
    console.error('create-subscription-order error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message, stack: err instanceof Error ? err.stack : undefined }), 
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
