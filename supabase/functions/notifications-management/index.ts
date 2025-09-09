import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Firebase ID token with base64url-safe parsing
function base64UrlToBase64(input: string) {
  return input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
}

async function verifyFirebaseToken(idToken: string) {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) throw new Error('Malformed token')
    const payloadStr = atob(base64UrlToBase64(parts[1]))
    const payload = JSON.parse(payloadStr)

    const now = Math.floor(Date.now() / 1000)
    if (!payload?.sub) throw new Error('Missing subject')
    if (!payload?.iss || !payload.iss.includes('securetoken.google.com')) throw new Error('Invalid issuer')
    if (payload?.exp && payload.exp < now) throw new Error('Token expired')

    return payload.sub as string // Firebase UID
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

type Action = 'list' | 'mark_read' | 'mark_all_read';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify Firebase token
    const authHeader = req.headers.get('authorization') || ''
    const idToken = authHeader.replace('Bearer ', '')
    
    if (!idToken) {
      return new Response(
        JSON.stringify({ error: 'No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let firebaseUid
    try {
      firebaseUid = await verifyFirebaseToken(idToken)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, notification_id } = await req.json();

    switch (action as Action) {
      case 'list': {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', firebaseUid)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'mark_read': {
        if (!notification_id) throw new Error('notification_id is required');
        const { error } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notification_id)
          .eq('user_id', firebaseUid);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'mark_all_read': {
        const { error } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', firebaseUid)
          .is('read_at', null);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});