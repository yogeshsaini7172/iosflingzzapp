import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 QCS Debug Analysis Starting...');

    // Test the atomic_qcs_update function
    const testUserId = '5Lwwzy91cYby88u3p9oAtNS9Mq53';
    
    console.log(`Testing atomic_qcs_update for user: ${testUserId}`);
    
    const { data: atomicResult, error: atomicError } = await supabase.rpc('atomic_qcs_update', {
      p_user_id: testUserId,
      p_total_score: 75,
      p_logic_score: 70,
      p_ai_score: 80,
      p_ai_meta: JSON.stringify({ test: 'debug' }),
      p_per_category: JSON.stringify({ basic: 0.8, physical: 0.7 }),
      p_total_score_float: 75.5
    });

    if (atomicError) {
      console.error('❌ Atomic update failed:', atomicError);
    } else {
      console.log('✅ Atomic update result:', atomicResult);
    }

    // Check current QCS data
    const { data: qcsData, error: qcsError } = await supabase
      .from('qcs')
      .select('*')
      .eq('user_id', testUserId)
      .maybeSingle();

    if (qcsError) {
      console.error('❌ QCS fetch error:', qcsError);
    } else {
      console.log('📊 Current QCS data:', qcsData);
    }

    // Check profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('firebase_uid, total_qcs, qcs_synced_at')
      .eq('firebase_uid', testUserId)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
    } else {
      console.log('👤 Current profile data:', profileData);
    }

    // Test basic QCS scoring logic
    const { data: fullProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('firebase_uid', testUserId)
      .maybeSingle();

    if (profileFetchError) {
      console.error('❌ Full profile fetch error:', profileFetchError);
    } else {
      console.log('🔍 Full profile keys:', Object.keys(fullProfile || {}));
      
      // Basic scoring test
      const age = fullProfile?.date_of_birth ? 
        (new Date().getTime() - new Date(fullProfile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000) : 0;
      
      const basicScore = {
        age: age,
        bio_length: fullProfile?.bio?.length || 0,
        interests_count: Array.isArray(fullProfile?.interests) ? fullProfile.interests.length : 0,
        university: fullProfile?.university || 'none',
        year_of_study: fullProfile?.year_of_study || 0
      };
      
      console.log('📈 Basic scoring components:', basicScore);
    }

    return new Response(JSON.stringify({
      success: true,
      debug: {
        atomic_update: { result: atomicResult, error: atomicError },
        qcs_data: qcsData,
        profile_data: profileData,
        full_profile_available: !!fullProfile,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 QCS Debug error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});