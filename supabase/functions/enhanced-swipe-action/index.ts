import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Verify Firebase ID token
async function verifyFirebaseToken(idToken: string) {
  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      throw new Error('Firebase service account not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    
    // Use base64url-safe decoding for JWT payload
    const base64UrlPayload = idToken.split('.')[1]
    const base64Payload = base64UrlPayload.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64Payload))
    
    // Validate token claims
    if (!payload.iss?.includes('securetoken.google.com') || 
        !payload.aud?.includes(serviceAccount.project_id) ||
        !payload.sub) {
      throw new Error('Invalid token issuer, audience or subject')
    }
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) {
      throw new Error('Token expired')
    }
    
    return payload.sub // Return Firebase UID
  } catch (error) {
    console.error('Token verification error:', error)
    throw new Error('Invalid or expired token')
  }
}

interface SwipeRequest {
  target_user_id: string;
  direction: 'left' | 'right';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    )

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

    const { target_user_id, direction }: SwipeRequest = await req.json()

    console.log(`📝 Function invocation: enhanced-swipe-action`, { user_id: firebaseUid, target_user_id, direction });

    // Log function invocation for observability
    await supabaseClient.from('function_invocations').insert({
      function_name: 'enhanced-swipe-action',
      payload: { user_id: firebaseUid, target_user_id, direction },
      user_id: firebaseUid,
      status: 'started'
    }).then(r => console.log('Logged invocation:', r.error || 'success'));

    if (!target_user_id || !direction) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`📝 Processing swipe: ${firebaseUid} -> ${target_user_id} (${direction})`);
    
    // Use the transaction function to handle the swipe
    const { data: swipeResult, error: swipeError } = await supabaseClient.rpc(
      'record_enhanced_swipe',
      {
        p_user_id: firebaseUid,
        p_target_user_id: target_user_id,
        p_direction: direction
      }
    );

    if (swipeError) {
      console.error('Error processing swipe:', swipeError);
      
      // Handle specific database errors
      if (swipeError.code === '23505') { // unique_violation
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Duplicate swipe',
            message: 'You have already swiped on this profile'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (swipeError.code === '23503') { // foreign_key_violation
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid user',
            message: 'One or both users do not exist'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to process swipe',
          message: swipeError.message,
          details: swipeError.details
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Swipe processed successfully:', swipeResult);

          return new Response(
      JSON.stringify({
        success: true,
        matched: swipeResult.is_match,
        matchId: swipeResult.match_id,
        chatRoomId: swipeResult.chat_room_id,
        message: swipeResult.is_match 
          ? "It's a match!" 
          : direction === 'right' 
            ? "Like sent!" 
            : "Profile passed"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});