// COPY THIS ENTIRE FILE TO SUPABASE DASHBOARD
// Function name: create-subscription-order

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '600'
  };
}

function verifyFirebaseToken(idToken: string) {
  if (!idToken || typeof idToken !== 'string') throw new Error('Invalid token');
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) throw new Error('Token expired');
  if (!payload.sub) throw new Error('No sub in token');
  return payload.sub as string;
}

serve(async (req) => {
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: buildCorsHeaders(req) 
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', 
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('No auth');
    }
    const idToken = authHeader.replace('Bearer ', '').trim();
    const firebaseUid = verifyFirebaseToken(idToken);

    const body = await req.json();
    const amount = Number(body.amount || 0);
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `rcpt_${Date.now()}`;
    const plan = body.plan || 'unknown';

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }), 
        { 
          status: 400, 
          headers: { 
            ...buildCorsHeaders(req), 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Call Razorpay REST API to create order
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys not configured');
    }

    const orderPayload = { 
      amount: Math.round(amount * 100), 
      currency, 
      receipt, 
      payment_capture: 1 
    };
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
      console.error('Razorpay create order failed', txt);
      return new Response(
        JSON.stringify({ error: 'Razorpay error', details: txt }), 
        { 
          status: 502, 
          headers: { 
            ...buildCorsHeaders(req), 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const order = await rpRes.json();

    const subscriptionId = crypto.randomUUID();
    const insert = await supabaseAdmin.from('subscriptions').insert([{ 
      id: subscriptionId, 
      user_id: firebaseUid, 
      plan, 
      start_date: new Date().toISOString(), 
      is_active: false, 
      razorpay_order_id: order.id 
    }]);
    
    if (insert.error) {
      console.error('Insert subscription error', insert.error.message || insert.error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: order.id, 
        amount: order.amount, 
        currency: order.currency, 
        subscriptionId 
      }), 
      { 
        headers: { 
          ...buildCorsHeaders(req), 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (err) {
    console.error('create-subscription-order error', err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }), 
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
