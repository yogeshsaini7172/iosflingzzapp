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

// Lightweight JWT parse + validation
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
    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, subscriptionId } = body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !subscriptionId) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!keySecret) throw new Error('Razorpay secret not configured');

    // compute HMAC using Web Crypto
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(keySecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
    const generated = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (generated !== razorpay_signature) {
      console.warn('Signature mismatch', { generated, provided: razorpay_signature });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });

    const update = await supabaseAdmin.from('subscriptions').update({ is_active: true, razorpay_payment_id, payment_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', subscriptionId);
    if (update.error) {
      console.error('Update error', update.error);
      return new Response(JSON.stringify({ error: 'Failed to update subscription' }), { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    // Fetch subscription to get user_id and plan
    const { data: subRow, error: subErr } = await supabaseAdmin.from('subscriptions').select('user_id, plan, start_date, end_date').eq('id', subscriptionId).single();
    if (subErr || !subRow) {
      console.error('Failed to fetch subscription after update', subErr);
      // Still return success for verification but warn
      return new Response(JSON.stringify({ success: true, message: 'Payment verified, but failed to fetch subscription' }), { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const userId = subRow.user_id as string;
    const plan = subRow.plan as string;

    // Update the user's profile to reflect active subscription
    try {
      const profileUpdate = await supabaseAdmin.from('profiles').update({
        subscription_plan: plan,
        is_subscribed: true,
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: subRow.end_date ?? null,
        updated_at: new Date().toISOString()
      }).eq('id', userId);

      if (profileUpdate.error) {
        console.error('Failed to update profile for user', userId, profileUpdate.error);
      }

      // Insert a subscription history record (best-effort)
      const historyInsert = await supabaseAdmin.from('subscription_history').insert([{ subscription_id: subscriptionId, user_id: userId, plan, amount: null, razorpay_order_id: razorpay_order_id, razorpay_payment_id, activated_at: new Date().toISOString() }]);
      if (historyInsert.error) {
        console.error('Failed to insert subscription_history', historyInsert.error);
      }
    } catch (profileErr) {
      console.error('Error updating profile/subscription history', profileErr);
    }

    return new Response(JSON.stringify({ success: true, message: 'Payment verified and subscription activated' }), { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('verify-subscription-payment error', err);
    const message = err instanceof Error ? err.message : String(err);
    const headers = { ...buildCorsHeaders(new Request('')) as Record<string,string>, 'Content-Type': 'application/json' };
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
