import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Firebase ID token
async function verifyFirebaseToken(idToken: string) {
  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      throw new Error('Firebase service account not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    const payload = JSON.parse(atob(idToken.split('.')[1]))
    
    if (!payload.iss?.includes('firebase') || !payload.aud?.includes(serviceAccount.project_id)) {
      throw new Error('Invalid token issuer or audience')
    }
    
    return payload.sub // Return Firebase UID
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