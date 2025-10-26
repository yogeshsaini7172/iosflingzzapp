/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="deno.ns" />

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-firebase-token',
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify Firebase token (prefer X-Firebase-Token header, fallback to Authorization)
    const xFirebaseToken = req.headers.get('x-firebase-token') || req.headers.get('X-Firebase-Token');
    let idToken = xFirebaseToken && xFirebaseToken.trim();

    if (!idToken) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        idToken = authHeader.replace('Bearer ', '').trim();
      }
    }

    if (!idToken) {
      return new Response(
        JSON.stringify({ error: 'No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let firebaseUid;
    try {
      firebaseUid = await verifyFirebaseToken(idToken);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
          lifestyle: profileData.lifestyle || null,
          love_language: profileData.love_language || profileData.loveLanguage,
          humor_type: profileData.humor_type || profileData.humorType,
          profession: profileData.profession || null,
          education_level: profileData.education_level || profileData.educationLevel || null,
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
          qualities: qualities,
          requirements: initialRequirements,
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

        // Normalize JSON fields if they were stored as strings and extract qualities/requirements
        let normalizedProfile = profile;
        if (normalizedProfile) {
          try { 
            if (typeof normalizedProfile.qualities === 'string') {
              normalizedProfile.qualities = JSON.parse(normalizedProfile.qualities); 
            }
          } catch (_) {}
          try { 
            if (typeof normalizedProfile.requirements === 'string') {
              normalizedProfile.requirements = JSON.parse(normalizedProfile.requirements); 
            }
          } catch (_) {}

          // Extract qualities data into individual profile fields for UI compatibility
          if (normalizedProfile.qualities && typeof normalizedProfile.qualities === 'object') {
            const qualities = normalizedProfile.qualities;
            // Physical attributes
            normalizedProfile.height = normalizedProfile.height || qualities.height;
            normalizedProfile.body_type = normalizedProfile.body_type || qualities.body_type;
            normalizedProfile.skin_tone = normalizedProfile.skin_tone || qualities.skin_tone;
            normalizedProfile.face_type = normalizedProfile.face_type || qualities.face_type;
            
            // Personality & values - ensure arrays
            normalizedProfile.personality_traits = Array.isArray(qualities.personality_traits) 
              ? qualities.personality_traits 
              : qualities.personality_type 
                ? [qualities.personality_type] 
                : normalizedProfile.personality_traits || [];
                
                console.log(`[DEBUG] Normalizing values for profile ${normalizedProfile.user_id}:`, {
                  qualities_values: qualities.values,
                  qualities_values_type: typeof qualities.values,
                  values_array: normalizedProfile.values_array,
                  top_level_values: normalizedProfile.values
                });

                normalizedProfile.values = Array.isArray(qualities.values)
                  ? qualities.values
                  : Array.isArray(normalizedProfile.values_array)
                    ? normalizedProfile.values_array
                    : normalizedProfile.values
                      ? [normalizedProfile.values]
                      : [];

                console.log(`[DEBUG] Final normalized values:`, normalizedProfile.values);
                  
            normalizedProfile.mindset = Array.isArray(qualities.mindset) 
              ? qualities.mindset 
              : qualities.mindset 
                ? [qualities.mindset] 
                : [];
                
            // Goals & interests
            normalizedProfile.relationship_goals = normalizedProfile.relationship_goals || qualities.relationship_goals || [];
            normalizedProfile.interests = normalizedProfile.interests || qualities.interests || [];
            
            // Other attributes
            normalizedProfile.love_language = normalizedProfile.love_language || qualities.love_language;
            normalizedProfile.lifestyle = normalizedProfile.lifestyle || qualities.lifestyle;
            normalizedProfile.university = normalizedProfile.university || qualities.university;
            normalizedProfile.field_of_study = normalizedProfile.field_of_study || qualities.field_of_study;
            normalizedProfile.education_level = normalizedProfile.education_level || qualities.education_level;
            normalizedProfile.profession = normalizedProfile.profession || qualities.profession;
          }
        }

        return new Response(JSON.stringify({
          success: true,
          data: { user_id: firebaseUid, profile: normalizedProfile },
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
          love_language: profileData.love_language || profileData.loveLanguage || null,
          lifestyle: profileData.lifestyle || null,
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
          qualities: updateQualities,
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

        // Also get requirements from profiles table as fallback/supplement
        const { data: profileReq, error: profileReqError } = await supabaseClient
          .from('profiles')
          .select('requirements')
          .eq('firebase_uid', firebaseUid)
          .limit(1)
          .maybeSingle();

        let mergedPreferences = preferences;

        // If no preferences found in partner_preferences table, use requirements from profiles
        if (!preferences && profileReq?.requirements) {
          try {
            const requirements = typeof profileReq.requirements === 'string' 
              ? JSON.parse(profileReq.requirements) 
              : profileReq.requirements;
            
            if (requirements && typeof requirements === 'object') {
              mergedPreferences = {
                user_id: firebaseUid,
                preferred_gender: requirements.preferred_gender || [],
                age_range_min: requirements.age_range_min || 18,
                age_range_max: requirements.age_range_max || 30,
                height_range_min: requirements.height_range_min || 150,
                height_range_max: requirements.height_range_max || 200,
                preferred_body_types: requirements.preferred_body_types || [],
                preferred_values: requirements.preferred_values || [],
                preferred_mindset: requirements.preferred_mindset || [],
                preferred_personality_traits: requirements.preferred_personality_traits || [],
                preferred_relationship_goals: requirements.preferred_relationship_goals || [],
                preferred_skin_tone: requirements.preferred_skin_tone || requirements.preferred_skin_types || [],
                preferred_face_type: requirements.preferred_face_types || [],
                preferred_love_language: requirements.preferred_love_languages || [],
                preferred_lifestyle: requirements.preferred_lifestyle || [],
                preferred_education_levels: requirements.preferred_education_levels || [],
                preferred_professions: requirements.preferred_professions || [],
                preferred_interests: requirements.preferred_interests || [],
                preferred_communication_style: requirements.preferred_communication_style || [],
                min_shared_interests: requirements.min_shared_interests || 2,
                personality_compatibility: requirements.personality_compatibility || 'moderate',
                lifestyle_compatibility: requirements.lifestyle_compatibility || 'important'
              };
              console.log('📋 Using requirements from profiles table as preferences:', mergedPreferences);
            }
          } catch (e) {
            console.warn('Failed to parse requirements JSON:', e);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          data: { user_id: firebaseUid, preferences: mergedPreferences },
          message: 'Preferences fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'update_preferences':
        if (!preferencesData) {
          throw new Error('Preferences data is required');
        }

        console.log(`[DEBUG] Raw preferences data:`, preferencesData);

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
          // FIX: Handle both singular and plural forms from frontend
          preferred_relationship_goals: preferencesData.preferred_relationship_goals || preferencesData.preferred_relationship_goal || [],
          preferred_interests: preferencesData.preferred_interests || [],
          preferred_love_languages: preferencesData.preferred_love_language || preferencesData.preferred_love_languages || [],
          preferred_communication_style: preferencesData.preferred_communication_style || [],
          preferred_lifestyle: preferencesData.preferred_lifestyle || [],
          // Compatibility requirements
          min_shared_interests: preferencesData.min_shared_interests || 2,
          personality_compatibility: preferencesData.personality_compatibility || "moderate",
          lifestyle_compatibility: preferencesData.lifestyle_compatibility || "important"
        };

        console.log(`[DEBUG] Built requirements object:`, requirements);

        // Check if record exists
        const { data: existingPrefs } = await supabaseClient
          .from('partner_preferences')
          .select('user_id')
          .eq('user_id', firebaseUid)
          .limit(1)
          .maybeSingle();

        let prefResult;

        // Map incoming preferences to DB columns robustly
        const dbPrefs: Record<string, any> = {
          preferred_gender: preferencesData.preferred_gender ?? [],
          age_range_min: preferencesData.age_range_min ?? 18,
          age_range_max: preferencesData.age_range_max ?? 30,
          height_range_min: preferencesData.height_range_min ?? 150,
          height_range_max: preferencesData.height_range_max ?? 200,
          preferred_body_types: preferencesData.preferred_body_types ?? [],
          preferred_values: preferencesData.preferred_values ?? [],
          preferred_mindset: preferencesData.preferred_mindset ?? [],
          preferred_personality_traits: preferencesData.preferred_personality_traits ?? [],
          preferred_skin_tone: preferencesData.preferred_skin_tone ?? preferencesData.preferred_skin_types ?? [],
          preferred_lifestyle: preferencesData.preferred_lifestyle ?? [],
          preferred_face_types: preferencesData.preferred_face_types ?? preferencesData.preferred_face_type ?? [],
          preferred_love_languages: preferencesData.preferred_love_languages ?? preferencesData.preferred_love_language ?? [],
          preferred_education_levels: preferencesData.preferred_education_levels ?? [],
          preferred_professions: preferencesData.preferred_professions ?? [],
          preferred_interests: preferencesData.preferred_interests ?? [],
          preferred_communication_style: preferencesData.preferred_communication_style ?? [],
          preferred_drinking: preferencesData.preferred_drinking ?? [],
          preferred_smoking: preferencesData.preferred_smoking ?? [],
          min_shared_interests: preferencesData.min_shared_interests ?? 2,
          personality_compatibility: preferencesData.personality_compatibility ?? 'moderate',
          lifestyle_compatibility: preferencesData.lifestyle_compatibility ?? 'important',
          updated_at: new Date().toISOString(),
        };

        if (existingPrefs) {
          const { data, error } = await supabaseClient
            .from('partner_preferences')
            .update(dbPrefs)
            .eq('user_id', firebaseUid)
            .select()
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          prefResult = { data, error };
        } else {
          const { data, error } = await supabaseClient
            .from('partner_preferences')
            .insert({ user_id: firebaseUid, ...dbPrefs })
            .select()
            .maybeSingle();
          prefResult = { data, error };
        }

        if (prefResult.error) throw prefResult.error;

        // Also update the requirements in profiles table (FIX: Don't double-stringify)
        const { error: profileUpdateError } = await supabaseClient
          .from('profiles')
          .update({ 
            requirements: requirements,  // Store as JSON, not stringified JSON
            updated_at: new Date().toISOString()
          })
          .eq('firebase_uid', firebaseUid);

        if (profileUpdateError) {
          console.warn('Could not update profile requirements:', profileUpdateError);
        }

        console.log(`[DATA-MANAGEMENT] Preferences updated successfully for ${firebaseUid}`);
        console.log(`[DEBUG] Final preferences data:`, prefResult.data);
        
        return new Response(JSON.stringify({
          success: true,
          data: { user_id: firebaseUid, preferences: prefResult.data },
          message: 'Preferences updated'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_feed':
        console.log(`[DATA-MANAGEMENT] Fetching feed for user: ${firebaseUid}`);
        
        // Get user's gender preferences
        const { data: userPreferences } = await supabaseClient
          .from('partner_preferences')
          .select('preferred_gender, age_range_min, age_range_max')
          .eq('user_id', firebaseUid)
          .maybeSingle();

        console.log(`[DATA-MANAGEMENT] User preferences:`, userPreferences);

        // For new users without preferences, return a simple feed
        if (!userPreferences) {
          console.log(`[DATA-MANAGEMENT] No preferences found, returning basic feed`);
          
          const { data: basicFeed, error: basicError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('is_active', true)
            .eq('show_profile', true)
            .neq('firebase_uid', firebaseUid)
            .limit(limit || 20);

          if (basicError) throw basicError;

          // Normalize basic feed profiles
          const normalizedBasicFeed = (basicFeed || []).map((profile: any) => {
            let normalizedProfile = { ...profile };
            if (normalizedProfile) {
              try { 
                if (typeof normalizedProfile.qualities === 'string') {
                  normalizedProfile.qualities = JSON.parse(normalizedProfile.qualities); 
                }
              } catch (_) {}
              try { 
                if (typeof normalizedProfile.requirements === 'string') {
                  normalizedProfile.requirements = JSON.parse(normalizedProfile.requirements); 
                }
              } catch (_) {}

              // Extract qualities data into individual profile fields for UI compatibility
              if (normalizedProfile.qualities && typeof normalizedProfile.qualities === 'object') {
                const qualities = normalizedProfile.qualities;
                // Physical attributes
                normalizedProfile.height = normalizedProfile.height || qualities.height;
                normalizedProfile.body_type = normalizedProfile.body_type || qualities.body_type;
                normalizedProfile.skin_tone = normalizedProfile.skin_tone || qualities.skin_tone;
                normalizedProfile.face_type = normalizedProfile.face_type || qualities.face_type;
                
                // Personality & values - ensure arrays
                normalizedProfile.personality_traits = Array.isArray(qualities.personality_traits) 
                  ? qualities.personality_traits 
                  : qualities.personality_type 
                    ? [qualities.personality_type] 
                    : normalizedProfile.personality_traits || [];
                    
                normalizedProfile.values = Array.isArray(qualities.values) 
                  ? qualities.values 
                  : Array.isArray(normalizedProfile.values_array)
                    ? normalizedProfile.values_array
                    : normalizedProfile.values
                      ? [normalizedProfile.values]
                      : [];
                    
                normalizedProfile.mindset = Array.isArray(qualities.mindset) 
                  ? qualities.mindset 
                  : qualities.mindset 
                    ? [qualities.mindset] 
                    : [];
                    
                // Goals & interests
                normalizedProfile.relationship_goals = normalizedProfile.relationship_goals || qualities.relationship_goals || [];
                normalizedProfile.interests = normalizedProfile.interests || qualities.interests || [];
                
                // Other attributes
                normalizedProfile.love_language = normalizedProfile.love_language || qualities.love_language;
                normalizedProfile.lifestyle = normalizedProfile.lifestyle || qualities.lifestyle;
                normalizedProfile.university = normalizedProfile.university || qualities.university;
                normalizedProfile.field_of_study = normalizedProfile.field_of_study || qualities.field_of_study;
                normalizedProfile.education_level = normalizedProfile.education_level || qualities.education_level;
                normalizedProfile.profession = normalizedProfile.profession || qualities.profession;
              }
            }
            return normalizedProfile;
          });

          console.log(`[DATA-MANAGEMENT] Basic feed fetched: ${normalizedBasicFeed.length} profiles`);
          return new Response(JSON.stringify({
            success: true,
            data: { profiles: normalizedBasicFeed },
            message: 'Basic feed fetched (no preferences)'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Get swiped users to exclude
        const { data: swipedUsers } = await supabaseClient
          .from('enhanced_swipes')
          .select('target_user_id')
          .eq('user_id', firebaseUid)

        const swipedUserIds = swipedUsers?.map((s: any) => s.target_user_id) || []

        // Get blocked users to exclude
        const { data: blockedUsers } = await supabaseClient
          .from('user_interactions')
          .select('target_user_id')
          .eq('user_id', firebaseUid)
          .in('interaction_type', ['ghost', 'bench'])

        const blockedUserIds = blockedUsers?.map((b: any) => b.target_user_id) || []

        // Get matched users to exclude
        const { data: matchedUsers } = await supabaseClient
          .from('enhanced_matches')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${firebaseUid},user2_id.eq.${firebaseUid}`)

        const matchedUserIds = matchedUsers?.map((m: any) =>
          m.user1_id === firebaseUid ? m.user2_id : m.user1_id
        ) || []

        // Build exclusion list
        const allExcludedIds = [
          firebaseUid,
          ...swipedUserIds,
          ...blockedUserIds,
          ...matchedUserIds
        ]

        console.log(`[DATA-MANAGEMENT] Excluding ${allExcludedIds.length} users from feed`);

        // Build profile query
        let feedQuery = supabaseClient
          .from('profiles')
          .select('*')
          .eq('is_active', true)
          .eq('show_profile', true)
          .neq('user_id', firebaseUid)

        // Exclude all blocked/swiped/matched users
        if (allExcludedIds.length > 1) { // More than just the current user
          feedQuery = feedQuery.not('user_id', 'in', `(${allExcludedIds.join(',')})`)
        }

        // Apply gender filtering based on user preferences
        if (userPreferences?.preferred_gender && userPreferences.preferred_gender.length > 0) {
          const preferredGenders = userPreferences.preferred_gender
            .map((g: any) => (typeof g === 'string' ? g.toLowerCase().trim() : ''))
            .filter((g: string) => g && ['male', 'female', 'non_binary'].includes(g))

          console.log(`[DATA-MANAGEMENT] Applying gender filter:`, preferredGenders);
          
          if (preferredGenders.length > 0) {
            feedQuery = feedQuery.in('gender', preferredGenders)
          }
        }

        // Apply age filtering based on user preferences
        if (userPreferences?.age_range_min || userPreferences?.age_range_max) {
          const currentYear = new Date().getFullYear()
          
          if (userPreferences.age_range_max) {
            // For max age 30, show people born after (currentYear - 30)
            const minBirthYear = currentYear - userPreferences.age_range_max
            feedQuery = feedQuery.gte('date_of_birth', `${minBirthYear}-01-01`)
          }
          
          if (userPreferences.age_range_min) {
            // For min age 18, show people born before (currentYear - 18)
            const maxBirthYear = currentYear - userPreferences.age_range_min
            feedQuery = feedQuery.lte('date_of_birth', `${maxBirthYear}-12-31`)
          }
          
          console.log(`[DATA-MANAGEMENT] Applying age filter: ${userPreferences.age_range_min}-${userPreferences.age_range_max}`);
        }

        const { data: feedProfiles, error: feedError } = await feedQuery.limit(limit || 20);

        if (feedError) throw feedError;

        // Normalize profiles for feed (similar to get_profile)
        const normalizedFeedProfiles = (feedProfiles || []).map((profile: any) => {
          let normalizedProfile = { ...profile };
          if (normalizedProfile) {
            try { 
              if (typeof normalizedProfile.qualities === 'string') {
                normalizedProfile.qualities = JSON.parse(normalizedProfile.qualities); 
              }
            } catch (_) {}
            try { 
              if (typeof normalizedProfile.requirements === 'string') {
                normalizedProfile.requirements = JSON.parse(normalizedProfile.requirements); 
              }
            } catch (_) {}

            // Extract qualities data into individual profile fields for UI compatibility
            if (normalizedProfile.qualities && typeof normalizedProfile.qualities === 'object') {
              const qualities = normalizedProfile.qualities;
              // Physical attributes
              normalizedProfile.height = normalizedProfile.height || qualities.height;
              normalizedProfile.body_type = normalizedProfile.body_type || qualities.body_type;
              normalizedProfile.skin_tone = normalizedProfile.skin_tone || qualities.skin_tone;
              normalizedProfile.face_type = normalizedProfile.face_type || qualities.face_type;
              
              // Personality & values - ensure arrays
              normalizedProfile.personality_traits = Array.isArray(qualities.personality_traits) 
                ? qualities.personality_traits 
                : qualities.personality_type 
                  ? [qualities.personality_type] 
                  : normalizedProfile.personality_traits || [];
                  
              normalizedProfile.values = Array.isArray(qualities.values) 
                ? qualities.values 
                : Array.isArray(normalizedProfile.values_array)
                  ? normalizedProfile.values_array
                  : normalizedProfile.values
                    ? [normalizedProfile.values]
                    : [];
                  
              normalizedProfile.mindset = Array.isArray(qualities.mindset) 
                ? qualities.mindset 
                : qualities.mindset 
                  ? [qualities.mindset] 
                  : [];
                  
              // Goals & interests
              normalizedProfile.relationship_goals = normalizedProfile.relationship_goals || qualities.relationship_goals || [];
              normalizedProfile.interests = normalizedProfile.interests || qualities.interests || [];
              
              // Other attributes
              normalizedProfile.love_language = normalizedProfile.love_language || qualities.love_language;
              normalizedProfile.lifestyle = normalizedProfile.lifestyle || qualities.lifestyle;
              normalizedProfile.university = normalizedProfile.university || qualities.university;
              normalizedProfile.field_of_study = normalizedProfile.field_of_study || qualities.field_of_study;
              normalizedProfile.education_level = normalizedProfile.education_level || qualities.education_level;
              normalizedProfile.profession = normalizedProfile.profession || qualities.profession;
            }
          }
          return normalizedProfile;
        });

        console.log(`[DATA-MANAGEMENT] Feed fetched: ${normalizedFeedProfiles.length} profiles with gender filtering applied`);
        return new Response(JSON.stringify({
          success: true,
          data: { profiles: normalizedFeedProfiles },
          message: 'Feed fetched with preferences applied'
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

  } catch (error: unknown) {
    console.error('[DATA-MANAGEMENT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});