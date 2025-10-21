import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

declare const Deno: any;

// Accept either a Request or an origin string; if missing, fall back to CLIENT_URL or '*'
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

// Lightweight JWT parse + validation (no signature verification for now)
function verifyFirebaseToken(idToken: string) {
  if (!idToken || typeof idToken !== 'string') throw new Error('Invalid token');
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp <= now) throw new Error('Token expired');
    if (!payload.sub && !payload.user_id) throw new Error('No user ID in token');
    
    return payload.sub || payload.user_id as string;
  } catch (err) {
    console.error('Token decode error:', err);
    throw new Error('Invalid token');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: buildCorsHeaders(req) });

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });

    // Read Firebase token from X-Firebase-Token header (sent by fetchWithFirebaseAuth)
    const firebaseToken = req.headers.get('x-firebase-token') || '';
    console.log('Firebase token present:', !!firebaseToken);
    
    if (!firebaseToken) {
      console.error('No Firebase token provided');
      return new Response(JSON.stringify({ error: 'No Firebase authentication token' }), { 
        status: 401, 
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('Token length:', firebaseToken.length);
    
    let firebaseUid: string;
    try {
      firebaseUid = verifyFirebaseToken(firebaseToken);
      console.log('Firebase UID verified:', firebaseUid);
    } catch (tokenErr) {
      console.error('Token verification failed:', tokenErr);
      return new Response(JSON.stringify({ error: 'Invalid token', details: tokenErr instanceof Error ? tokenErr.message : String(tokenErr) }), { 
        status: 401, 
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json();
    console.log('Request body:', { plan: body.plan, amount: body.amount });
    
    const amount = Number(body.amount || 0);
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `rcpt_${Date.now()}`;
    const plan = body.plan || 'unknown';

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount);
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    // Call Razorpay REST API to create order
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    console.log('Razorpay keys configured:', { keyId: !!keyId, keySecret: !!keySecret });
    
    if (!keyId || !keySecret) {
      console.error('Razorpay keys not configured');
      return new Response(JSON.stringify({ error: 'Razorpay keys not configured' }), { 
        status: 500, 
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
      });
    }

    const orderPayload = { amount: Math.round(amount * 100), currency, receipt, payment_capture: 1 };
    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Basic ${basicAuth}` }, body: JSON.stringify(orderPayload)
    });

    if (!rpRes.ok) {
      const txt = await rpRes.text();
      console.error('Razorpay create order failed', txt);
      return new Response(JSON.stringify({ error: 'Razorpay error', details: txt }), { status: 502, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const order = await rpRes.json();

    const subscriptionId = crypto.randomUUID();
    const insert = await supabaseAdmin.from('subscriptions').insert([{ id: subscriptionId, user_id: firebaseUid, plan, start_date: new Date().toISOString(), is_active: false, razorpay_order_id: order.id }]);
    if (insert.error) console.error('Insert subscription error', insert.error.message || insert.error);

    return new Response(JSON.stringify({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, subscriptionId }), { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('create-subscription-order error', err);
    const message = err instanceof Error ? err.message : String(err);
    const headers = { ...buildCorsHeaders(new Request('')) as Record<string,string>, 'Content-Type': 'application/json' };
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
