import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

function buildCorsHeaders(reqOrOrigin) {
  let origin = '*';
  if (typeof reqOrOrigin === 'string') {
    origin = reqOrOrigin;
  } else if (reqOrOrigin && typeof reqOrOrigin.headers?.get === 'function') {
    origin = reqOrOrigin.headers.get('origin') || (Deno?.env?.get('CLIENT_URL') ?? '*');
  } else {
    origin = typeof Deno !== 'undefined' && Deno.env?.get('CLIENT_URL') || '*';
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
function verifyFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== 'string') throw new Error('Invalid token');
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp <= now) throw new Error('Token expired');
    if (!payload.sub && !payload.user_id) throw new Error('No user ID in token');
    return payload.sub || payload.user_id;
  } catch (err) {
    console.error('Token decode error:', err);
    throw new Error('Invalid token');
  }
}

serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(req)
  });
  try {
    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, subscriptionId } = body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !subscriptionId) return new Response(JSON.stringify({
      error: 'Missing fields'
    }), {
      status: 400,
      headers: {
        ...buildCorsHeaders(req),
        'Content-Type': 'application/json'
      }
    });
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) throw new Error('Razorpay secret not configured');
    // compute HMAC using Web Crypto
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(keySecret), {
      name: 'HMAC',
      hash: 'SHA-256'
    }, false, [
      'sign'
    ]);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
    const generated = Array.from(new Uint8Array(sig)).map((b)=>b.toString(16).padStart(2, '0')).join('');
    if (generated !== razorpay_signature) {
      console.warn('Signature mismatch', {
        generated,
        provided: razorpay_signature
      });
      return new Response(JSON.stringify({
        error: 'Invalid signature'
      }), {
        status: 400,
        headers: {
          ...buildCorsHeaders(req),
          'Content-Type': 'application/json'
        }
      });
    }
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        }
      }
    });
    const update = await supabaseAdmin.from('subscriptions').update({
      is_active: true,
      razorpay_payment_id,
      payment_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', subscriptionId);
    if (update.error) {
      console.error('Update error', update.error);
      return new Response(JSON.stringify({
        error: 'Failed to update subscription'
      }), {
        status: 500,
        headers: {
          ...buildCorsHeaders(req),
          'Content-Type': 'application/json'
        }
      });
    }
    // Fetch subscription to get user_id and plan
    const { data: subRow, error: subErr } = await supabaseAdmin.from('subscriptions').select('user_id, plan, start_date, end_date').eq('id', subscriptionId).single();
    if (subErr || !subRow) {
      console.error('Failed to fetch subscription after update', subErr);
      // Still return success for verification but warn
      return new Response(JSON.stringify({
        success: true,
        message: 'Payment verified, but failed to fetch subscription'
      }), {
        headers: {
          ...buildCorsHeaders(req),
          'Content-Type': 'application/json'
        }
      });
    }
    const userId = subRow.user_id;
    const plan = subRow.plan;
    // Update the user's profile to reflect active subscription
    try {
      // Map plan to tier (e.g., 'basic_69' -> 'basic')
      const tier = plan.split('_')[0];
      console.log('Updating profile for user:', userId, 'Plan:', plan, 'Tier:', tier);
      
      // Update profile using PostgreSQL function
      const { data: profileData, error: profileError } = await supabaseAdmin.rpc('update_user_subscription', {
        p_user_id: userId,
        p_plan: plan,
        p_tier: tier,
        p_end_date: subRow.end_date
      });
      
      console.log('Profile RPC result:', JSON.stringify({ data: profileData, error: profileError }));
      
      if (profileError) {
        console.error('❌ Profile update failed:', profileError);
      } else if (profileData && profileData.length > 0 && profileData[0].success) {
        console.log('✅ Profile updated successfully via RPC:', profileData[0].message);
      } else {
        console.warn('⚠️ Profile update completed but check result:', profileData);
      }
      // Insert a subscription history record (best-effort)
      // Match your subscription_history table structure: id, user_id, tier, amount, start_date, end_date, payment_id, status, created_at
      const amount = plan === 'basic_69' ? 6900 : plan === 'standard_129' ? 12900 : 24300;
      // Calculate end_date if not present (30 days from start)
      let endDate = subRow.end_date;
      if (!endDate && subRow.start_date) {
        const start = new Date(subRow.start_date);
        start.setDate(start.getDate() + 30);
        endDate = start.toISOString();
      }
      const historyInsert = await supabaseAdmin.from('subscription_history').insert([
        {
          user_id: userId,
          tier: tier,
          amount: amount,
          start_date: subRow.start_date,
          end_date: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_id: razorpay_payment_id,
          status: 'active'
        }
      ]);
      if (historyInsert.error) {
        console.error('Failed to insert subscription_history', historyInsert.error);
      } else {
        console.log('Successfully inserted subscription_history for user', userId);
      }
    } catch (profileErr) {
      console.error('Error updating profile/subscription history', profileErr);
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Payment verified and subscription activated'
    }), {
      headers: {
        ...buildCorsHeaders(req),
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('verify-subscription-payment error', err);
    const message = err instanceof Error ? err.message : String(err);
    const headers = {
      ...buildCorsHeaders(new Request('')),
      'Content-Type': 'application/json'
    };
    return new Response(JSON.stringify({
      error: message
    }), {
      status: 500,
      headers
    });
  }
});
