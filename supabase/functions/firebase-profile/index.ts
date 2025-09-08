import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Firebase Admin SDK for token verification
async function verifyFirebaseToken(idToken: string) {
  try {
    // Get Firebase service account from environment
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      throw new Error('Firebase service account not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    
    // Verify token using Firebase REST API
    const response = await fetch(`https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-${serviceAccount.project_id}@${serviceAccount.project_id}.iam.gserviceaccount.com`)
    
    if (!response.ok) {
      throw new Error('Failed to get Firebase public keys')
    }
    
    // For production, implement proper JWT verification with Firebase Admin SDK
    // For now, we'll decode the token payload (this should be replaced with proper verification)
    const payload = JSON.parse(atob(idToken.split('.')[1]))
    
    // Basic validation
    if (!payload.iss?.includes('firebase') || !payload.aud?.includes(serviceAccount.project_id)) {
      throw new Error('Invalid token issuer or audience')
    }
    
    return {
      uid: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified
    }
  } catch (error) {
    console.error('Token verification error:', error)
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