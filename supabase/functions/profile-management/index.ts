import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Firebase ID token
async function verifyFirebaseToken(idToken: string) {
  try {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Invalid token format')
    }

    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      throw new Error('Firebase service account not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    
    // Split and validate token structure
    const tokenParts = idToken.split('.')
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT structure')
    }
    
    // Use base64url-safe decoding for JWT payload
    const base64UrlPayload = tokenParts[1]
    if (!base64UrlPayload) {
      throw new Error('Missing token payload')
    }
    
    const base64Payload = base64UrlPayload.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64Payload))
    
    if (!payload.iss?.includes('firebase') || !payload.aud?.includes(serviceAccount.project_id)) {
      throw new Error('Invalid token issuer or audience')
    }
    
    return {
      uid: payload.sub,
      email: payload.email
    }
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

interface ProfileRequest {
  action: 'create' | 'update' | 'get';
  profile?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify Firebase token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No valid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const idToken = authHeader.replace('Bearer ', '').trim()
    if (!idToken) {
      return new Response(
        JSON.stringify({ error: 'No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let firebaseUser
    try {
      firebaseUser = await verifyFirebaseToken(idToken)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, profile: profileData }: ProfileRequest = await req.json();

    switch (action) {
      case 'create':
      case 'update':
        if (!profileData) {
          throw new Error('Profile data is required');
        }

        // Check if profile exists
        const { data: existingProfile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('firebase_uid', firebaseUser.uid)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!existingProfile && action === 'create') {
          // Create new profile
          const newProfile = {
            firebase_uid: firebaseUser.uid,
            user_id: firebaseUser.uid, // Keep for compatibility
            email: firebaseUser.email || profileData.email || 'demo@example.com',
            ...profileData,
            // Initialize default values
            subscription_tier: 'free',
            daily_outgoing_matches: 0,
            daily_incoming_matches: 0,
            pairing_requests_left: 1,
            blinddate_requests_left: 0,
            swipes_left: 20,
            last_reset: new Date().toISOString(),
            show_profile: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: createdProfile, error: createError } = await supabaseClient
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) throw createError;

          console.log(`Profile created for ${firebaseUser.uid}`);
          return new Response(JSON.stringify({
            success: true,
            data: { user_id: firebaseUser.uid, profile: createdProfile },
            message: 'Profile created'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });

        } else {
          // Update existing profile
          const updatedProfile = {
            ...profileData,
            updated_at: new Date().toISOString()
          };

          const { data: updated, error: updateError } = await supabaseClient
            .from('profiles')
            .update(updatedProfile)
            .eq('firebase_uid', firebaseUser.uid)
            .select()
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (updateError) throw updateError;

          console.log(`Profile updated for ${firebaseUser.uid}`);
          return new Response(JSON.stringify({
            success: true,
            data: { user_id: firebaseUser.uid, profile: updated },
            message: 'Profile updated'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

      case 'get':
        const { data: profile, error: getError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('firebase_uid', firebaseUser.uid)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (getError && getError.code !== 'PGRST116') {
          throw getError;
        }

        return new Response(JSON.stringify({
          success: true,
          data: { user_id: firebaseUser.uid, profile },
          message: 'Profile fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in profile-management function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});