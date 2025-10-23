# FINAL DEPLOYMENT - verify-subscription-payment

## CRITICAL: Copy this EXACT code to Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/cchvsqeqiavhanurnbeo/functions/verify-subscription-payment
2. Click "Edit Function"
3. **DELETE ALL EXISTING CODE**
4. **PASTE THE CODE BELOW**
5. Click "Deploy"

---

```typescript
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

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !subscriptionId) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { 
        status: 400, 
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
      });
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) throw new Error('Razorpay secret not configured');

    // Verify signature
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(keySecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
    const generated = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (generated !== razorpay_signature) {
      console.warn('Signature mismatch');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
        status: 400, 
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
      });
    }

    // Create Supabase admin client (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: 'public' }
      }
    );

    // Update subscription
    const update = await supabaseAdmin.from('subscriptions').update({ 
      is_active: true, 
      razorpay_payment_id, 
      payment_completed_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    }).eq('id', subscriptionId);

    if (update.error) {
      console.error('Update error', update.error);
      return new Response(JSON.stringify({ error: 'Failed to update subscription' }), { 
        status: 500, 
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
      });
    }

    // Fetch subscription details
    const { data: subRow, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, plan, start_date, end_date')
      .eq('id', subscriptionId)
      .single();

    if (subErr || !subRow) {
      console.error('Failed to fetch subscription', subErr);
      return new Response(JSON.stringify({ success: true, message: 'Payment verified, but failed to fetch subscription' }), { 
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
      });
    }

    const userId = subRow.user_id as string;
    const plan = subRow.plan as string;
    const tier = plan.split('_')[0];

    console.log('Updating profile for user:', userId, 'Plan:', plan, 'Tier:', tier);

    // Update profile
    const profileUpdate = await supabaseAdmin.from('profiles').update({
      subscription_plan: plan,
      subscription_tier: tier,
      plan_id: plan,
      is_subscribed: true,
      subscription_started_at: new Date().toISOString(),
      subscription_expires_at: subRow.end_date ?? null,
      plan_started_at: new Date().toISOString(),
      plan_expires_at: subRow.end_date ?? null,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId).select();

    console.log('Profile update result:', JSON.stringify(profileUpdate));

    if (profileUpdate.error) {
      console.error('Profile update failed:', profileUpdate.error);
    } else if (!profileUpdate.data || profileUpdate.data.length === 0) {
      console.error('NO ROWS UPDATED for user:', userId);
    } else {
      console.log('✅ Profile updated successfully:', profileUpdate.data[0]);
    }

    // Insert history
    const amount = plan === 'basic_69' ? 6900 : plan === 'standard_129' ? 12900 : 24300;
    let endDate = subRow.end_date;
    if (!endDate && subRow.start_date) {
      const start = new Date(subRow.start_date);
      start.setDate(start.getDate() + 30);
      endDate = start.toISOString();
    }

    await supabaseAdmin.from('subscription_history').insert([{ 
      user_id: userId, 
      tier: tier,
      amount: amount,
      start_date: subRow.start_date,
      end_date: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      payment_id: razorpay_payment_id,
      status: 'active'
    }]);

    return new Response(JSON.stringify({ success: true, message: 'Payment verified and subscription activated' }), { 
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    console.error('verify-subscription-payment error', err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { ...buildCorsHeaders(new Request('')) as Record<string,string>, 'Content-Type': 'application/json' } 
    });
  }
});
```

---

## After Deploying:

1. Make a test payment
2. Check Edge Function logs for: `✅ Profile updated successfully`
3. Run this SQL:

```sql
SELECT user_id, subscription_plan, subscription_tier, plan_id, is_subscribed
FROM public.profiles
ORDER BY updated_at DESC
LIMIT 3;
```

4. Send me the SQL result!
