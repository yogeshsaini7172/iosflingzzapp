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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    console.log(`🔧 QCS System Repair: ${action}`);

    if (action === 'diagnose') {
      // 1. Test OpenAI API
      let openaiStatus = 'disabled';
      let openaiError = null;
      
      if (openaiApiKey) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: 'Test' }],
              max_tokens: 5
            }),
          });
          
          if (response.ok) {
            openaiStatus = 'working';
          } else {
            openaiStatus = 'error';
            openaiError = await response.text();
          }
        } catch (e) {
          openaiStatus = 'error';
          openaiError = e.message;
        }
      }

      // 2. Test atomic_qcs_update function
      const testUserId = '5Lwwzy91cYby88u3p9oAtNS9Mq53';
      const { data: atomicResult, error: atomicError } = await supabase.rpc('atomic_qcs_update', {
        p_user_id: testUserId,
        p_total_score: 75,
        p_logic_score: 70,
        p_ai_score: 80,
        p_ai_meta: JSON.stringify({ test: 'diagnostic' }),
        p_per_category: JSON.stringify({ basic: 0.8 }),
        p_total_score_float: 75.0
      });

      // 3. Check QCS data integrity
      const { data: qcsStats } = await supabase
        .from('qcs')
        .select('user_id, total_score, ai_score, logic_score')
        .not('ai_score', 'is', null)
        .limit(5);

      const { data: profileStats } = await supabase
        .from('profiles')
        .select('firebase_uid, total_qcs, qcs_synced_at')
        .not('qcs_synced_at', 'is', null)
        .limit(5);

      return new Response(JSON.stringify({
        success: true,
        diagnosis: {
          openai_status: openaiStatus,
          openai_error: openaiError,
          atomic_function: {
            working: !atomicError,
            error: atomicError?.message,
            result: atomicResult
          },
          data_integrity: {
            qcs_with_ai_scores: qcsStats?.length || 0,
            profiles_with_sync_time: profileStats?.length || 0
          },
          recommendations: [
            openaiStatus === 'error' ? 'Fix OpenAI API key or connection' : null,
            atomicError ? 'Fix atomic_qcs_update database function' : null,
            (qcsStats?.length || 0) === 0 ? 'QCS records missing AI/logic scores' : null,
            (profileStats?.length || 0) === 0 ? 'Profiles not being updated with QCS sync times' : null
          ].filter(Boolean)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'repair') {
      console.log('🔨 Starting QCS system repair...');
      
      // Get all profiles that need QCS repair
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('firebase_uid, first_name, total_qcs, date_of_birth, bio, interests, university, year_of_study, body_type, personality_type')
        .not('firebase_uid', 'is', null)
        .limit(20); // Process in batches

      if (profilesError) throw profilesError;

      let repaired = 0;
      let failed = 0;

      for (const profile of profiles || []) {
        try {
          // Calculate a proper QCS score based on profile data
          const age = profile.date_of_birth ? 
            (new Date().getTime() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000) : 20;
          
          const bioScore = Math.min(20, (profile.bio?.length || 0) / 4); // Max 20 points
          const interestsScore = Math.min(15, (profile.interests?.length || 0) * 5); // Max 15 points
          const eduScore = profile.university ? (profile.university.includes('IIT') ? 25 : 15) : 10;
          const ageScore = Math.max(0, 20 - Math.abs(age - 22)); // Optimal age around 22
          const personalityScore = profile.personality_type ? 10 : 5;
          
          const calculatedQCS = Math.min(100, Math.round(
            bioScore + interestsScore + eduScore + ageScore + personalityScore
          ));

          // Update using atomic function
          const { data: updateResult, error: updateError } = await supabase.rpc('atomic_qcs_update', {
            p_user_id: profile.firebase_uid,
            p_total_score: calculatedQCS,
            p_logic_score: calculatedQCS,
            p_ai_score: null,
            p_ai_meta: JSON.stringify({ repair: true, timestamp: new Date().toISOString() }),
            p_per_category: JSON.stringify({ 
              bio: bioScore/20, 
              interests: interestsScore/15, 
              education: eduScore/25,
              age: ageScore/20,
              personality: personalityScore/10
            }),
            p_total_score_float: calculatedQCS
          });

          if (updateError) {
            console.error(`Failed to repair ${profile.firebase_uid}:`, updateError.message);
            failed++;
          } else {
            console.log(`✅ Repaired QCS for ${profile.first_name}: ${calculatedQCS}`);
            repaired++;
          }

        } catch (error) {
          console.error(`Error processing ${profile.firebase_uid}:`, error.message);
          failed++;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        repair_results: {
          profiles_processed: (profiles || []).length,
          successfully_repaired: repaired,
          failed: failed,
          timestamp: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action. Use "diagnose" or "repair"'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 QCS System Repair error:', error);
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