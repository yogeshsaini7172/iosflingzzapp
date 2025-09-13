import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jwtVerify, createRemoteJWKSet } from 'https://deno.land/x/jose@v5.1.3/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Firebase project configuration
const FIREBASE_PROJECT_ID = 'datingapp-275cb';
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_AUDIENCE = FIREBASE_PROJECT_ID;

// Google's public keys for Firebase token verification
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

// Proper Firebase JWT verification using jose library
async function verifyFirebaseToken(idToken: string) {
  try {
    console.log('🔍 Verifying Firebase token...');
    
    // Debug: Check token structure
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed JWT token');
    }

    // Decode payload for debugging (without verification)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    console.log('📋 Token payload preview:', {
      iss: payload.iss,
      aud: payload.aud,
      sub: payload.sub?.substring(0, 10) + '...',
      firebase: !!payload.firebase,
      exp: new Date(payload.exp * 1000).toISOString()
    });

    // Verify token using jose library with Google's JWKs
    const { payload: verifiedPayload } = await jwtVerify(idToken, JWKS, {
      issuer: FIREBASE_ISSUER,
      audience: FIREBASE_AUDIENCE,
    });

    console.log('✅ Firebase token verified successfully:', {
      uid: verifiedPayload.sub,
      email: verifiedPayload.email,
      provider: verifiedPayload.firebase?.sign_in_provider
    });

    return {
      uid: verifiedPayload.sub!,
      email: verifiedPayload.email as string || null,
      email_verified: verifiedPayload.email_verified as boolean || false
    };
    
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error.message);
    console.error('❌ Full error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('expired')) {
      throw new Error('Firebase token has expired');
    } else if (error.message.includes('audience')) {
      throw new Error('Invalid token audience - not for this Firebase project');
    } else if (error.message.includes('issuer')) {
      throw new Error('Invalid token issuer - not from Firebase');
    } else {
      throw new Error('Invalid Firebase token');
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract Firebase token
    const authHeader = req.headers.get('authorization') || ''
    const idToken = authHeader.replace('Bearer ', '')
    
    if (!idToken) {
      return new Response(
        JSON.stringify({ error: 'No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Firebase token using jose library
    let firebaseUser
    try {
      firebaseUser = await verifyFirebaseToken(idToken)
      console.log('✅ Verified Firebase user:', firebaseUser.uid)
    } catch (error) {
      console.error('❌ Token verification failed:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Fetch user profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ profile: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Handle profile creation/update or simple verification
      let body = {}
      try {
        const requestBody = await req.text()
        if (requestBody) {
          body = JSON.parse(requestBody)
        }
      } catch (e) {
        // If no body or invalid JSON, treat as simple verification request
        console.log('No valid JSON body, treating as verification request')
      }

      // If body has profile data, update profile
      if (Object.keys(body).length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({ 
            firebase_uid: firebaseUser.uid,
            user_id: firebaseUser.uid, // Keep user_id for compatibility
            email: firebaseUser.email,
            ...body,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'firebase_uid'
          })
          .select()
          .maybeSingle()

        if (error) {
          console.error('Profile upsert error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to save profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ profile: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // For simple verification (used by swipe-enforcement), return userId 
    return new Response(
      JSON.stringify({ userId: firebaseUser.uid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Server error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})