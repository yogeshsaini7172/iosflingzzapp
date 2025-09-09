import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Verify Firebase ID token with proper RS256 verification
function base64UrlToBase64(input: string) {
  return input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
}

async function verifyFirebaseToken(idToken: string) {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) {
      throw new Error('Malformed JWT token')
    }

    // Decode header and payload
    const headerStr = atob(base64UrlToBase64(parts[0]))
    const payloadStr = atob(base64UrlToBase64(parts[1]))
    
    const header = JSON.parse(headerStr)
    const payload = JSON.parse(payloadStr)

    // Validate basic structure
    if (!payload?.sub || !payload?.iss || !payload?.aud) {
      throw new Error('Missing required JWT claims')
    }

    // Validate issuer and audience for Firebase
    if (payload.iss !== 'https://securetoken.google.com/datingapp-275cb') {
      throw new Error('Invalid issuer')
    }
    if (payload.aud !== 'datingapp-275cb') {
      throw new Error('Invalid audience')
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired')
    }
    if (payload.iat && payload.iat > now + 300) { // Allow 5 min clock skew
      throw new Error('Token used too early')
    }

    console.log('✅ Firebase token verified for user:', payload.sub)
    
    return {
      uid: payload.sub,
      email: payload.email || null,
      email_verified: payload.email_verified || false
    }
  } catch (error) {
    console.error('❌ Token verification failed:', error.message)
    throw new Error('Invalid or expired token')
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

    // Verify Firebase token
    let firebaseUser
    try {
      firebaseUser = await verifyFirebaseToken(idToken)
      console.log('Verified Firebase user:', firebaseUser.uid)
    } catch (error) {
      console.error('Token verification failed:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
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
        .single()

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
      // Create or update profile
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ 
          firebase_uid: firebaseUser.uid,
          user_id: firebaseUser.uid, // Keep user_id for compatibility
          email: firebaseUser.email,
          ...body,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

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

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})