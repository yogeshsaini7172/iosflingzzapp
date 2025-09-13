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
    
    // Add debug logging for profile creation
    if (action === 'create_profile') {
      console.log('[DEBUG] Profile data received:', JSON.stringify(profileData, null, 2));
    }

    switch (action) {
      case 'create_profile':
        if (!profileData) {
          throw new Error('Profile data is required');
        }

        // Build qualities JSON from profile data
        const qualities = {
          // Physical qualities
          height: profileData.height || null,
          body_type: profileData.body_type || profileData.bodyType || null,
          skin_tone: profileData.skin_tone || profileData.skinTone || null,
          face_type: profileData.face_type || profileData.faceType || null,
          // Mental/Personality qualities
          personality_type: profileData.personality_type || profileData.personalityType || null,
          personality_traits: profileData.personality_traits || profileData.personalityTraits || [],
          values: Array.isArray(profileData.values) ? profileData.values : (profileData.values ? [profileData.values] : []),
          mindset: Array.isArray(profileData.mindset) ? profileData.mindset : (profileData.mindset ? [profileData.mindset] : []),
          relationship_goals: profileData.relationship_goals || profileData.relationshipGoals || [],
          interests: profileData.interests || [],
          love_language: profileData.love_language || profileData.loveLanguage || null,
          lifestyle: profileData.lifestyle || null,
          // Education and career
          university: profileData.university || null,
          field_of_study: profileData.field_of_study || profileData.fieldOfStudy || null,
          education_level: profileData.education_level || profileData.educationLevel || null,
          profession: profileData.profession || null,
          // Communication style
          bio_length: profileData.bio ? profileData.bio.length : 0,
          communication_style: profileData.bio && profileData.bio.length > 100 ? "expressive" : "concise",
          profile_completeness: (profileData.bio && profileData.profile_images?.length >= 2 && profileData.interests?.length >= 3) ? "detailed" : "basic"
        };

        // Build initial requirements JSON - defaults
        const initialRequirements = {
          // Physical requirements - defaults
          height_range_min: 150,
          height_range_max: 200,
          preferred_body_types: [],
          preferred_skin_types: [],
          preferred_face_types: [],
          preferred_gender: [],
          // Age requirements - defaults
          age_range_min: 18,
          age_range_max: 30,
          // Mental/Personality requirements - defaults
          preferred_personality_traits: [],
          preferred_values: [],
          preferred_mindset: [],
          preferred_relationship_goals: [],
          preferred_interests: [],
          preferred_love_languages: [],
          preferred_communication_style: [],
          preferred_lifestyle: [],
          // Compatibility requirements
          min_shared_interests: 2,
          personality_compatibility: "moderate",
          lifestyle_compatibility: "important"
        };

        const newProfile = {
          firebase_uid: firebaseUid,
          user_id: firebaseUid, // Keep for compatibility
          // Map frontend field names to database field names properly
          first_name: profileData.first_name || profileData.firstName || '',
          last_name: profileData.last_name || profileData.lastName || '', 
          email: profileData.email || `${firebaseUid}@firebase.user`,
          date_of_birth: profileData.date_of_birth || profileData.dateOfBirth,
          gender: profileData.gender,
          university: profileData.university || '',
          major: profileData.major || profileData.field_of_study || profileData.fieldOfStudy,
          year_of_study: profileData.year_of_study || profileData.yearOfStudy,
          field_of_study: profileData.field_of_study || profileData.fieldOfStudy,
          height: profileData.height ? Number(profileData.height) : null,
          body_type: profileData.body_type || profileData.bodyType,
          skin_tone: profileData.skin_tone || profileData.skinTone,
          face_type: profileData.face_type || profileData.faceType,
          personality_type: profileData.personality_type || profileData.personalityType,
          personality_traits: profileData.personality_traits || (profileData.personalityType ? [profileData.personalityType] : []),
          values: profileData.values,
          values_array: profileData.values_array || (profileData.values ? [profileData.values] : []),
          mindset: profileData.mindset,
          love_language: profileData.love_language || profileData.loveLanguage,
          humor_type: profileData.humor_type || profileData.humorType,
          relationship_goals: profileData.relationship_goals || profileData.relationshipGoals || [],
          interests: profileData.interests || [],
          bio: profileData.bio || '',
          profile_images: profileData.profile_images || [],
          display_name: profileData.display_name || `${profileData.first_name || profileData.firstName || ''} ${profileData.last_name || profileData.lastName || ''}`.trim(),
          avatar_url: profileData.avatar_url || (profileData.profile_images && profileData.profile_images.length > 0 ? profileData.profile_images[0] : null),
          location: profileData.location,
          is_profile_public: profileData.is_profile_public !== undefined ? profileData.is_profile_public : true,
          total_qcs: profileData.total_qcs || 0,
          // Add structured JSON fields for QCS/compatibility
          qualities: JSON.stringify(qualities),
          requirements: JSON.stringify(initialRequirements),
          subscription_tier: profileData.subscription_tier || 'free',
          daily_outgoing_matches: 0,
          daily_incoming_matches: 0,
          pairing_requests_left: 1,
          blinddate_requests_left: 0,
          swipes_left: 20,
          last_reset: new Date().toISOString(),
          show_profile: profileData.show_profile !== undefined ? profileData.show_profile : true,
          is_active: profileData.is_active !== undefined ? profileData.is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdProfile, error: createError } = await supabaseClient
          .from('profiles')
          .insert(newProfile)
          .select()
          .maybeSingle();

        if (createError) {
          console.error('[DEBUG] Profile creation error:', createError);
          throw new Error(`Failed to create profile: ${createError.message}`);
        }

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
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

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

        // Update updateQualities JSON when profile is updated
        const updateQualities = {
          // Physical qualities
          height: profileData.height || null,
          body_type: profileData.body_type || null, 
          skin_tone: profileData.skin_tone || null,
          face_type: profileData.face_type || null,
          // Mental/Personality qualities
          personality_type: profileData.personality_type || null,
          personality_traits: profileData.personality_traits || [],
          values: Array.isArray(profileData.values) ? profileData.values : (profileData.values ? [profileData.values] : []),
          mindset: Array.isArray(profileData.mindset) ? profileData.mindset : (profileData.mindset ? [profileData.mindset] : []),
          relationship_goals: profileData.relationship_goals || [],
          interests: profileData.interests || [],
          // Education and career
          university: profileData.university || null,
          field_of_study: profileData.field_of_study || null,
          education_level: profileData.education_level || null,
          profession: profileData.profession || null,
          // Communication style
          bio_length: profileData.bio ? profileData.bio.length : 0,
          communication_style: profileData.bio && profileData.bio.length > 100 ? "expressive" : "concise",
          profile_completeness: (profileData.bio && profileData.profile_images?.length >= 2 && profileData.interests?.length >= 3) ? "detailed" : "basic"
        };

        const updatedProfileData = {
          ...profileData,
          qualities: JSON.stringify(updateQualities),
          updated_at: new Date().toISOString()
        };

        const { data: updated, error: updateError } = await supabaseClient
          .from('profiles')
          .update(updatedProfileData)
          .eq('firebase_uid', firebaseUid)
          .select()
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

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
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

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

        // Build requirements JSON from preferences data
        const requirements = {
          // Physical requirements
          height_range_min: preferencesData.height_range_min || 150,
          height_range_max: preferencesData.height_range_max || 200,
          preferred_body_types: preferencesData.preferred_body_types || [],
          preferred_skin_types: preferencesData.preferred_skin_tone || [],
          preferred_face_types: preferencesData.preferred_face_type || [],
          preferred_gender: preferencesData.preferred_gender || [],
          // Age requirements
          age_range_min: preferencesData.age_range_min || 18,
          age_range_max: preferencesData.age_range_max || 30,
          // Mental/Personality requirements
          preferred_personality_traits: preferencesData.preferred_personality_traits || [],
          preferred_values: preferencesData.preferred_values || [],
          preferred_mindset: preferencesData.preferred_mindset || [],
          preferred_relationship_goals: preferencesData.preferred_relationship_goal || [],
          preferred_interests: preferencesData.preferred_interests || [],
          preferred_love_languages: preferencesData.preferred_love_language || [],
          preferred_communication_style: preferencesData.preferred_communication_style || [],
          preferred_lifestyle: preferencesData.preferred_lifestyle || [],
          // Compatibility requirements
          min_shared_interests: preferencesData.min_shared_interests || 2,
          personality_compatibility: preferencesData.personality_compatibility || "moderate",
          lifestyle_compatibility: preferencesData.lifestyle_compatibility || "important"
        };

        // Check if record exists
        const { data: existingPrefs } = await supabaseClient
          .from('partner_preferences')
          .select('user_id')
          .eq('user_id', firebaseUid)
          .limit(1)
          .maybeSingle();

        let prefResult;
        if (existingPrefs) {
          const { data, error } = await supabaseClient
            .from('partner_preferences')
            .update({ ...preferencesData, updated_at: new Date().toISOString() })
            .eq('user_id', firebaseUid)
            .select()
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          prefResult = { data, error };
        } else {
          const { data, error } = await supabaseClient
            .from('partner_preferences')
            .insert({ user_id: firebaseUid, ...preferencesData })
            .select()
            .maybeSingle();
          prefResult = { data, error };
        }

        if (prefResult.error) throw prefResult.error;

        // Also update the requirements in profiles table
        const { error: profileUpdateError } = await supabaseClient
          .from('profiles')
          .update({ 
            requirements: JSON.stringify(requirements),
            updated_at: new Date().toISOString()
          })
          .eq('firebase_uid', firebaseUid);

        if (profileUpdateError) {
          console.warn('Could not update profile requirements:', profileUpdateError);
        }

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
        // Enhanced pairing feed with compatibility scoring
        console.log(`[DATA-MANAGEMENT] Getting enhanced pairing feed for ${firebaseUid}`);
        
        // Call the enhanced pairing function
        const pairingResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enhanced-pairing`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ limit: limit || 10 })
        });

        if (!pairingResponse.ok) {
          console.error('Enhanced pairing function failed, falling back to basic pairing');
          
          // Fallback to basic pairing
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

          console.log(`[DATA-MANAGEMENT] Basic pairing feed fetched: ${pairingProfiles?.length} profiles`);
          return new Response(JSON.stringify({
            success: true,
            data: { profiles: pairingProfiles || [] },
            message: 'Basic pairing feed fetched'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const pairingData = await pairingResponse.json();
        
        console.log(`[DATA-MANAGEMENT] Enhanced pairing feed fetched: ${pairingData.data?.profiles?.length || 0} profiles`);
        return new Response(JSON.stringify({
          success: true,
          data: { profiles: pairingData.data?.profiles || [] },
          message: `Enhanced pairing feed: ${pairingData.message}`
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