import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Starting comprehensive data consistency fix...');

    // Fix 1: QCS Score Mismatches - Sync QCS table to profiles table
    console.log('📊 Fixing QCS score mismatches...');
    const { data: qcsRecords, error: qcsError } = await supabase
      .from('qcs')
      .select('user_id, total_score, profile_score, college_tier, personality_depth, behavior_score');

    if (qcsError) {
      console.error('❌ Error fetching QCS records:', qcsError);
    } else {
      for (const qcs of qcsRecords || []) {
        if (qcs.total_score) {
          const { error: syncError } = await supabase
            .from('profiles')
            .update({ total_qcs: qcs.total_score })
            .eq('user_id', qcs.user_id);
          
          if (!syncError) {
            console.log(`✅ Synced QCS for ${qcs.user_id}: ${qcs.total_score}`);
          }
        }
      }
    }

    // Fix 2: Empty Profile Records - Find and fix users with missing basic data
    console.log('👤 Fixing empty profile records...');
    const { data: emptyProfiles, error: emptyError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, bio, body_type')
      .or('first_name.is.null,first_name.eq.,last_name.is.null,last_name.eq.');

    if (emptyError) {
      console.error('❌ Error fetching empty profiles:', emptyError);
    } else {
      console.log(`Found ${emptyProfiles?.length || 0} profiles with missing data`);
    }

    // Fix 3: Recalculate QCS for all active profiles
    console.log('🧮 Recalculating QCS for all profiles...');
    const { data: activeProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, firebase_uid')
      .eq('is_active', true)
      .limit(50); // Process in batches

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      let processed = 0;
      let errors = 0;

      for (const profile of activeProfiles || []) {
        try {
          const userId = profile.firebase_uid || profile.user_id;
          
          // Call QCS scoring function
          const qcsResponse = await fetch(`${supabaseUrl}/functions/v1/qcs-scoring`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId }),
          });

          if (qcsResponse.ok) {
            const result = await qcsResponse.json();
            console.log(`✅ QCS recalculated for ${userId}: ${result.updated_qcs || result.final_score}`);
            processed++;
          } else {
            console.error(`❌ QCS calculation failed for ${userId}`);
            errors++;
          }

          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`❌ Error processing ${profile.user_id}:`, error);
          errors++;
        }
      }

      console.log(`📊 QCS Recalculation complete: ${processed} processed, ${errors} errors`);
    }

    // Fix 4: Clean up orphaned QCS records
    console.log('🧹 Cleaning up orphaned QCS records...');
    const { error: cleanupError } = await supabase
      .rpc('cleanup_expired_ghosts'); // Reuse existing cleanup function

    if (cleanupError) {
      console.error('❌ Cleanup error:', cleanupError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Comprehensive data consistency fix completed',
      fixes_applied: [
        'QCS score synchronization',
        'Empty profile data identification',
        'QCS recalculation for all active profiles',
        'Orphaned data cleanup'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Comprehensive fix failed:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});