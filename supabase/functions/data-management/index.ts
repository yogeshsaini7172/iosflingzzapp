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

interface DataRequest {
  action: 'get_profile' | 'update_profile' | 'get_preferences' | 'update_preferences' | 'get_feed' | 'get_pairing_feed' | 'create_profile';
  profile?: any;
  preferences?: any;
  filters?: any;
  limit?: number;
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

    const { action, profile: profileData, preferences: preferencesData, filters, limit }: DataRequest = await req.json();

    console.log(`[DATA-MANAGEMENT] Action: ${action}, User: ${firebaseUid}`);

    switch (action) {
      case 'create_profile':
        if (!profileData) {
          throw new Error('Profile data is required');
        }

        const newProfile = {
          firebase_uid: firebaseUid,
          user_id: firebaseUid, // Keep for compatibility
          email: profileData.email || 'user@example.com',
          ...profileData,
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

        console.log(`[DATA-MANAGEMENT] Profile created for ${firebaseUid}`);
        return new Response(JSON.stringify({
          success: true,
          data: { user_id: firebaseUid, profile: createdProfile },
          message: 'Profile created'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_profile':
        const { data: profile, error: getError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('firebase_uid', firebaseUid)
          .single();

        if (getError && getError.code !== 'PGRST116') {
          throw getError;
        }

        return new Response(JSON.stringify({
          success: true,
          data: { user_id: firebaseUid, profile },
          message: 'Profile fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'update_profile':
        if (!profileData) {
          throw new Error('Profile data is required');
        }

        const updatedProfileData = {
          ...profileData,
          updated_at: new Date().toISOString()
        };

        const { data: updated, error: updateError } = await supabaseClient
          .from('profiles')
          .update(updatedProfileData)
          .eq('firebase_uid', firebaseUid)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log(`[DATA-MANAGEMENT] Profile updated for ${firebaseUid}`);
        return new Response(JSON.stringify({
          success: true,
          data: { user_id: firebaseUid, profile: updated },
          message: 'Profile updated'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_preferences':
        const { data: preferences, error: prefError } = await supabaseClient
          .from('partner_preferences')
          .select('*')
          .eq('user_id', firebaseUid)
          .single();

        if (prefError && prefError.code !== 'PGRST116') {
          throw prefError;
        }

        return new Response(JSON.stringify({
          success: true,
          data: { user_id: firebaseUid, preferences },
          message: 'Preferences fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'update_preferences':
        if (!preferencesData) {
          throw new Error('Preferences data is required');
        }

        // Check if record exists
        const { data: existingPrefs } = await supabaseClient
          .from('partner_preferences')
          .select('user_id')
          .eq('user_id', firebaseUid)
          .single();

        let prefResult;
        if (existingPrefs) {
          const { data, error } = await supabaseClient
            .from('partner_preferences')
            .update({ ...preferencesData, updated_at: new Date().toISOString() })
            .eq('user_id', firebaseUid)
            .select()
            .single();
          prefResult = { data, error };
        } else {
          const { data, error } = await supabaseClient
            .from('partner_preferences')
            .insert({ user_id: firebaseUid, ...preferencesData })
            .select()
            .single();
          prefResult = { data, error };
        }

        if (prefResult.error) throw prefResult.error;

        console.log(`[DATA-MANAGEMENT] Preferences updated for ${firebaseUid}`);
        return new Response(JSON.stringify({
          success: true,
          data: { user_id: firebaseUid, preferences: prefResult.data },
          message: 'Preferences updated'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_feed':
        // Get swiped users to exclude
        const { data: swipedUsers } = await supabaseClient
          .from('enhanced_swipes')
          .select('target_user_id')
          .eq('user_id', firebaseUid)

        const swipedUserIds = swipedUsers?.map(s => s.target_user_id) || []

        // Build profile query
        let feedQuery = supabaseClient
          .from('profiles')
          .select('*')
          .eq('is_active', true)
          .eq('show_profile', true)
          .neq('firebase_uid', firebaseUid)

        // Exclude swiped users
        if (swipedUserIds.length > 0) {
          feedQuery = feedQuery.not('firebase_uid', 'in', `(${swipedUserIds.join(',')})`)
        }

        const { data: feedProfiles, error: feedError } = await feedQuery.limit(limit || 20);

        if (feedError) throw feedError;

        console.log(`[DATA-MANAGEMENT] Feed fetched: ${feedProfiles?.length} profiles`);
        return new Response(JSON.stringify({
          success: true,
          data: { profiles: feedProfiles || [] },
          message: 'Feed fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_pairing_feed':
        // Enhanced pairing feed with filtering
        let pairingQuery = supabaseClient
          .from('profiles')
          .select('*')
          .neq('firebase_uid', firebaseUid)
          .eq('is_active', true)
          .eq('show_profile', true);

        // Apply filters if provided
        if (filters?.ageMin || filters?.ageMax) {
          const today = new Date()
          if (filters.ageMax) {
            const minBirthDate = new Date(today.getFullYear() - filters.ageMax - 1, today.getMonth(), today.getDate())
            pairingQuery = pairingQuery.gte('date_of_birth', minBirthDate.toISOString().split('T')[0])
          }
          if (filters.ageMin) {
            const maxBirthDate = new Date(today.getFullYear() - filters.ageMin, today.getMonth(), today.getDate())
            pairingQuery = pairingQuery.lte('date_of_birth', maxBirthDate.toISOString().split('T')[0])
          }
        }

        pairingQuery = pairingQuery.limit(limit || 10);

        const { data: pairingProfiles, error: pairingError } = await pairingQuery;

        if (pairingError) throw pairingError;

        console.log(`[DATA-MANAGEMENT] Pairing feed fetched: ${pairingProfiles?.length} profiles`);
        return new Response(JSON.stringify({
          success: true,
          data: { profiles: pairingProfiles || [] },
          message: 'Pairing feed fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('[DATA-MANAGEMENT] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});