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
      }> = [];

      // Process each profile
      for (const profile of profiles) {
        try {
          const oldScore = profile.total_qcs || 0;
          const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
          
          // Calculate comprehensive QCS score
          const age = profile.date_of_birth ? 
            (new Date().getTime() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000) : 20;
          
          // Profile completeness scoring (0-100 scale)
          let profileScore = 0;
          
          // Bio scoring (max 20 points)
          const bioLength = profile.bio?.length || 0;
          profileScore += Math.min(20, bioLength / 5); // 1 point per 5 characters, max 20
          
          // Interests scoring (max 15 points)
          const interestsCount = profile.interests?.length || 0;
          profileScore += Math.min(15, interestsCount * 2.5); // 2.5 points per interest, max 15
          
          // Education scoring (max 25 points)
          let eduScore = 5; // Base score
          if (profile.university) {
            const uni = profile.university.toLowerCase();
            if (uni.includes('iit') || uni.includes('nit') || uni.includes('iiit')) {
              eduScore = 25; // Top tier institutions
            } else if (uni.includes('university') || uni.includes('college')) {
              eduScore = 18; // Regular institutions
            } else {
              eduScore = 12; // Other educational backgrounds
            }
          }
          profileScore += eduScore;
          
          // Age scoring (max 20 points) - optimal range 18-26
          const ageScore = Math.max(0, 20 - Math.abs(age - 22) * 2);
          profileScore += ageScore;
          
          // Physical attributes (max 10 points)
          let physicalScore = 0;
          if (profile.height && profile.height > 0) physicalScore += 2;
          if (profile.body_type) physicalScore += 2;
          if (profile.skin_tone) physicalScore += 2;
          physicalScore += 4; // Base physical score
          profileScore += physicalScore;
          
          // Personality & values (max 10 points)
          let personalityScore = 0;
          if (profile.personality_type) personalityScore += 3;
          if (profile.values) personalityScore += 3;
          if (profile.mindset) personalityScore += 2;
          if (profile.lifestyle) personalityScore += 2;
          profileScore += personalityScore;
          
          const newScore = Math.min(100, Math.max(0, Math.round(profileScore)));
          
          // Update the profile with the new QCS score using atomic function
          const { data: updateResult, error: updateError } = await supabase.rpc('atomic_qcs_update', {
            p_user_id: profile.firebase_uid,
            p_total_score: newScore,
            p_logic_score: newScore,
            p_ai_score: null, // Will be calculated by AI later if available
            p_ai_meta: JSON.stringify({ 
              bulk_sync: true, 
              timestamp: new Date().toISOString(),
              version: 'bulk-sync-v1'
            }),
            p_per_category: JSON.stringify({
              bio: Math.round((Math.min(20, bioLength / 5) / 20) * 100) / 100,
              interests: Math.round((Math.min(15, interestsCount * 2.5) / 15) * 100) / 100,
              education: Math.round((eduScore / 25) * 100) / 100,
              age: Math.round((ageScore / 20) * 100) / 100,
              physical: Math.round((physicalScore / 10) * 100) / 100,
              personality: Math.round((personalityScore / 10) * 100) / 100
            }),
            p_total_score_float: newScore
          });

          if (updateError) {
            console.error(`❌ Failed to update QCS for ${profile.firebase_uid}:`, updateError.message);
            failCount++;
            details.push({
              user_id: profile.firebase_uid,
              name,
              old_score: oldScore,
              new_score: oldScore, // Keep old score on failure
              status: 'failed',
              error: updateError.message
            });
          } else {
            console.log(`✅ Updated QCS for ${name}: ${oldScore} → ${newScore}`);
            successCount++;
            details.push({
              user_id: profile.firebase_uid,
              name,
              old_score: oldScore,
              new_score: newScore,
              status: 'success'
            });
          }

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