import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { user_id } = await req.json();
    console.log(`Manual QCS calculation triggered for user: ${user_id}`);

    // Get profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .or(`firebase_uid.eq.${user_id},user_id.eq.${user_id}`)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      throw new Error(`Profile not found for user ${user_id}`);
    }

    console.log('Profile found:', profile.first_name, profile.last_name);

    // Calculate QCS components
    let profileScore = 20; // Base score
    if (profile.bio && profile.bio.length > 20) profileScore += 10;
    if (profile.profile_images && profile.profile_images.length >= 2) profileScore += 15;
    if (profile.interests && profile.interests.length >= 3) profileScore += 10;

    let collegeTier = 10; // Default
    if (profile.university) {
      const uni = profile.university.toLowerCase();
      if (uni.includes('iit') || uni.includes('nit') || uni.includes('iiit')) {
        collegeTier = 20;
      } else if (uni.includes('du') || uni.includes('delhi university')) {
        collegeTier = 15;
      }
    }

    let personalityDepth = 15; // Base
    if (profile.personality_type) personalityDepth += 10;
    if (profile.values) personalityDepth += 5;

    const behaviorScore = 15; // Base behavior score

    // Insert/update QCS record (total_score will be auto-calculated)
    const { data: qcsData, error: qcsError } = await supabaseClient
      .from('qcs')
      .upsert({
        user_id: user_id,
        profile_score: profileScore,
        college_tier: collegeTier,
        personality_depth: personalityDepth,
        behavior_score: behaviorScore,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (qcsError) {
      console.error('QCS upsert error:', qcsError);
      throw qcsError;
    }

    console.log('QCS record created/updated:', qcsData);

    // Sync to profiles table using the trigger (should happen automatically)
    // But let's also manually update to be sure
    const { error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update({ 
        total_qcs: qcsData.total_score,
        updated_at: new Date().toISOString()
      })
      .or(`firebase_uid.eq.${user_id},user_id.eq.${user_id}`);

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError);
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: user_id,
      qcs_score: qcsData.total_score,
      components: {
        profile_score: profileScore,
        college_tier: collegeTier,
        personality_depth: personalityDepth,
        behavior_score: behaviorScore
      },
      message: `QCS calculated successfully: ${qcsData.total_score}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Manual QCS calculation error:', errorMessage);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});