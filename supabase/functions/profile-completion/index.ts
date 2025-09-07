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

    // Upsert profile with service role (bypasses RLS) - creates if doesn't exist
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
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
        email: email || userEmail // Use provided email or Firebase email
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
      throw upsertError;
    }

    // Optionally upsert partner preferences if provided
    if (preferences) {
      const { preferredGender, ageRangeMin, ageRangeMax, preferredRelationshipGoals } = preferences;
      const { error: prefError } = await supabase
        .from('partner_preferences')
        .upsert({
          user_id: userId,
          preferred_gender: preferredGender ?? [],
          age_range_min: ageRangeMin ?? 18,
          age_range_max: ageRangeMax ?? 30,
          preferred_relationship_goal: preferredRelationshipGoals ?? []
        }, { onConflict: 'user_id' });

      if (prefError) {
        console.error('Error upserting partner preferences:', prefError);
        throw prefError;
      }
    }


    console.log('Successfully completed profile for user:', userId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Profile completed successfully'
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