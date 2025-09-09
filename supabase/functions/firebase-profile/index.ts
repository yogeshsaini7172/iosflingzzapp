import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Firebase Admin SDK for proper token verification
import { initializeApp, cert } from "https://esm.sh/firebase-admin@12.0.0/app";
import { getAuth } from "https://esm.sh/firebase-admin@12.0.0/auth";

let firebaseApp: any = null;

function getFirebaseApp() {
  if (!firebaseApp) {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('Firebase service account not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log('🔥 Initializing Firebase Admin with project:', serviceAccount.project_id);
    
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }
  return firebaseApp;
}

// Proper Firebase token verification using Admin SDK
async function verifyFirebaseToken(idToken: string) {
  try {
    console.log('🔍 Token type check - first few chars:', idToken.substring(0, 50));
    
    // Decode without verification first to see what we have
    const parts = idToken.split('.');
    if (parts.length === 3) {
      const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadStr);
      console.log('📋 Token payload preview:', {
        iss: payload.iss,
        aud: payload.aud,
        sub: payload.sub?.substring(0, 10) + '...',
        firebase: !!payload.firebase
      });
    }

    const app = getFirebaseApp();
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    
    console.log('✅ Firebase token verified successfully:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider: decodedToken.firebase?.sign_in_provider
    });
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      email_verified: decodedToken.email_verified || false
    };
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error.message);
    console.error('❌ Full error:', error);
    throw new Error('Invalid or expired Firebase token');
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

    // Verify Firebase token using Admin SDK
    let firebaseUser
    try {
      firebaseUser = await verifyFirebaseToken(idToken)
      console.log('✅ Verified Firebase user:', firebaseUser.uid)
    } catch (error) {
      console.error('❌ Token verification failed:', error)
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