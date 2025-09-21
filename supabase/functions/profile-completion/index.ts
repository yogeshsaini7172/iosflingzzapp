import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      university,
      yearOfStudy,
      fieldOfStudy,
      height,
      bodyType,
      skinTone,
      faceType,
      personalityType,
      values,
      mindset,
      relationshipGoals,
      interests,
      bio,
      profileImages,
      isProfilePublic,
      qcsScore,
      preferences,
      email
    } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user email from Firebase auth token or use a placeholder
    const authHeader = req.headers.get('authorization');
    let userEmail = '';
    
    if (authHeader) {
      try {
        // For Firebase users, we might need to pass email in the request body
        // since we can't easily decode Firebase tokens in edge functions
        userEmail = req.body?.email || 'firebase-user@datesigma.app';
      } catch (e) {
        userEmail = 'firebase-user@datesigma.app';
      }
    }

    console.log('Completing profile for user:', userId, 'with email:', userEmail);

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !gender) {
      throw new Error('Missing required fields: firstName, lastName, dateOfBirth, and gender are required');
    }

    // Upsert profile with service role (bypasses RLS) - creates if doesn't exist
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        firebase_uid: userId, // Use firebase_uid as the key
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        gender: gender,
        university: university,
        year_of_study: yearOfStudy ?? null,
        field_of_study: fieldOfStudy ?? null,
        height: height ?? null,
        body_type: bodyType ?? null,
        skin_tone: skinTone ?? null,
        face_type: faceType ?? null,
        personality_type: personalityType ?? null,
        values: values ?? null,
        mindset: mindset ?? null,
        relationship_goals: relationshipGoals ?? [],
        interests: interests ?? [],
        bio: bio ?? null,
        profile_images: profileImages ?? [],
        is_profile_public: isProfilePublic ?? true,
        verification_status: 'verified',
        is_active: true,
        last_active: new Date().toISOString(),
        total_qcs: qcsScore || 0,
        email: email || userEmail, // Use provided email or Firebase email
        // Set user qualities (what they offer) - COMPLETE DATA as objects, not strings
        qualities: {
          height: height || null,
          body_type: bodyType || null,
          skin_tone: skinTone || null,
          face_type: faceType || null,
          personality_type: personalityType || null,
          values: values ? [values] : [], // Convert to array for consistency
          mindset: mindset ? [mindset] : [], // Convert to array for consistency
          university: university || null,
          field_of_study: fieldOfStudy || null,
          interests: interests || [], // ADD: interests array
          relationship_goals: relationshipGoals || [], // ADD: relationship goals
          bio: bio || null, // ADD: bio text
          love_language: preferences?.loveLanguage || null, // ADD: love language
          lifestyle: preferences?.lifestyle || null // ADD: lifestyle
        },
        // Set user requirements (what they want in a partner) - COMPLETE DATA as objects, not strings
        requirements: {
          height_range_min: preferences?.heightRangeMin || null,
          height_range_max: preferences?.heightRangeMax || null,
          age_range_min: preferences?.ageRangeMin || 18, // ADD: age range
          age_range_max: preferences?.ageRangeMax || 30, // ADD: age range
          preferred_body_types: preferences?.preferredBodyTypes || [],
          preferred_skin_tone: preferences?.preferredSkinTone || [], // ADD: skin tone prefs
          preferred_face_type: preferences?.preferredFaceType || [], // ADD: face type prefs
          preferred_values: preferences?.preferredValues || [],
          preferred_mindset: preferences?.preferredMindset || [],
          preferred_personality: preferences?.preferredPersonality || [],
          preferred_gender: preferences?.preferredGender || [],
          preferred_relationship_goals: preferences?.preferredRelationshipGoals || [], // ADD: relationship goal prefs
          preferred_love_languages: preferences?.preferredLoveLanguage || [], // ADD: love language prefs
          preferred_lifestyle: preferences?.preferredLifestyle || [] // ADD: lifestyle prefs
        },
        // Also store individual fields for direct access
        love_language: preferences?.loveLanguage || null,
        lifestyle: preferences?.lifestyle ? JSON.stringify(preferences.lifestyle) : null
      }, {
        onConflict: 'firebase_uid' // Use firebase_uid as conflict target
      });

    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
      throw upsertError;
    }

    // Optionally upsert partner preferences if provided
    if (preferences) {
      const { 
        preferredGender, ageRangeMin, ageRangeMax, heightRangeMin, heightRangeMax,
        preferredBodyTypes, preferredSkinTone, preferredFaceType, preferredValues, 
        preferredMindset, preferredPersonality, preferredRelationshipGoals,
        preferredLoveLanguage, preferredLifestyle
      } = preferences;
      
      const { error: prefError } = await supabase
        .from('partner_preferences')
        .upsert({
          user_id: userId,
          preferred_gender: preferredGender ?? [],
          age_range_min: ageRangeMin ?? 18,
          age_range_max: ageRangeMax ?? 30,
          height_range_min: heightRangeMin ?? 150,
          height_range_max: heightRangeMax ?? 200,
          preferred_body_types: preferredBodyTypes ?? [],
          preferred_skin_tone: preferredSkinTone ?? [],
          preferred_face_types: preferredFaceType ?? [],
          preferred_values: preferredValues ?? [],
          preferred_mindset: preferredMindset ?? [],
          preferred_personality_traits: preferredPersonality ?? [],
          preferred_relationship_goals: preferredRelationshipGoals ?? [],
          preferred_love_languages: preferredLoveLanguage ?? [],
          preferred_lifestyle: preferredLifestyle ?? []
        }, { onConflict: 'user_id' });

      if (prefError) {
        console.error('Error upserting partner preferences:', prefError);
        throw prefError;
      }
    }


    console.log('Successfully completed profile for user:', userId);

    // Trigger QCS calculation using the new comprehensive algorithm
    try {
      console.log('🔄 Triggering QCS calculation for new profile...');
      const { error: qcsError } = await supabase.functions.invoke('qcs-scoring', {
        body: { user_id: userId }
      });
      
      if (qcsError) {
        console.warn('QCS calculation failed for new profile:', qcsError);
      } else {
        console.log('✅ QCS calculation triggered successfully for new profile');
      }
    } catch (qcsErr) {
      console.warn('QCS calculation error:', qcsErr);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Profile completed successfully and QCS calculation triggered'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in profile-completion function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});