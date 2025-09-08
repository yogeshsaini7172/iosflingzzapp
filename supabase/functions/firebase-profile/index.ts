import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // For now, we'll extract the user ID from the token payload (unsafe for production)
    // In production, verify with Firebase Admin SDK
    let firebaseUid: string
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]))
      firebaseUid = payload.sub || payload.uid
      console.log('Firebase UID:', firebaseUid)
    } catch (error) {
      console.error('Token decode error:', error)
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
        .eq('user_id', firebaseUid)
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
          user_id: firebaseUid,
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