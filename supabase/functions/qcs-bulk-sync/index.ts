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

    const { action } = await req.json();

    if (action === 'sync_all') {
      console.log('🔄 Starting QCS bulk sync for all profiles...');
      
      // Get all profiles that need QCS update
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('firebase_uid, first_name, last_name, total_qcs, date_of_birth, bio, interests, university, year_of_study, body_type, personality_type, skin_tone, values, mindset, lifestyle, height, major')
        .not('firebase_uid', 'is', null)
        .limit(100); // Process in batches to avoid timeouts

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          total_profiles: 0,
          successfully_synced: 0,
          failed: 0,
          details: [],
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let successCount = 0;
      let failCount = 0;
      const details: Array<{
        user_id: string;
        name: string;
        old_score: number;
        new_score: number;
        status: 'success' | 'failed';
        error?: string;
        logic_score?: number;
        ai_score?: number;
        psychology_score?: number;
        ai_status?: string;
      }> = [];

      // Process each profile using the new comprehensive QCS algorithm
      for (const profile of profiles) {
        try {
          const oldScore = profile.total_qcs || 0;
          const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
          
          console.log(`🔄 Processing ${name} (${profile.firebase_uid})`);
          
          // Call the comprehensive QCS scoring function
          const qcsResponse = await supabase.functions.invoke('qcs-scoring', {
            body: { 
              user_id: profile.firebase_uid,
              ai_weight: 0.5 // Use 50/50 blend of deterministic and AI scoring
            }
          });

          if (qcsResponse.error) {
            throw new Error(`QCS function error: ${qcsResponse.error.message || qcsResponse.error}`);
          }

          const qcsData = qcsResponse.data;
          
          if (!qcsData || !qcsData.success) {
            throw new Error(`QCS calculation failed: ${qcsData?.error || 'Unknown error'}`);
          }

          const newScore = qcsData.qcs?.total_score || qcsData.final_score || qcsData.updated_qcs || 60;
          
          console.log(`✅ Updated QCS for ${name}: ${oldScore} → ${newScore} (Logic: ${qcsData.qcs?.logic_score}, AI: ${qcsData.qcs?.ai_score || 'N/A'})`);
          
          successCount++;
          details.push({
            user_id: profile.firebase_uid,
            name,
            old_score: oldScore,
            new_score: newScore,
            status: 'success',
            logic_score: qcsData.qcs?.logic_score,
            ai_score: qcsData.qcs?.ai_score,
            psychology_score: qcsData.scoring_details?.psychology_model?.score,
            ai_status: qcsData.ai_status?.scoring_version || 'unknown'
          });

        } catch (error) {
          console.error(`❌ Error processing profile ${profile.firebase_uid}:`, error.message);
          failCount++;
          details.push({
            user_id: profile.firebase_uid,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
            old_score: profile.total_qcs || 0,
            new_score: profile.total_qcs || 0,
            status: 'failed',
            error: error.message
          });
        }
      }

      console.log(`🎯 QCS Bulk Sync Complete: ${successCount} success, ${failCount} failed out of ${profiles.length} total`);

      return new Response(JSON.stringify({
        success: true,
        total_profiles: profiles.length,
        successfully_synced: successCount,
        failed: failCount,
        details: details,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action. Use "sync_all"'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 QCS Bulk Sync error:', error);
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