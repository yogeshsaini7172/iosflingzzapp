// Data repair script to backfill missing QCS records and sync profiles.total_qcs
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Import the deterministic scoring from QCS function (simplified version)
function calculateDeterministicScore(profile: any): number {
  let score = 50; // Base score
  
  // Age factor (simple version)
  if (profile.date_of_birth) {
    try {
      const age = Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const ageFactor = Math.max(0, 1 - Math.abs(age - 25) / 20); // Optimal age around 25
      score += ageFactor * 15;
    } catch (e) {
      // Ignore age parsing errors
    }
  }
  
  // Education factor
  if (profile.university && profile.university.toLowerCase().includes('iit')) {
    score += 10;
  } else if (profile.university) {
    score += 5;
  }
  
  // Bio length factor
  if (profile.bio) {
    const bioLength = profile.bio.length;
    if (bioLength > 100) score += 10;
    else if (bioLength > 50) score += 5;
  }
  
  // Interests factor
  if (profile.interests && Array.isArray(profile.interests)) {
    score += Math.min(profile.interests.length * 2, 10);
  }
  
  // Profile completion factor
  let completedFields = 0;
  const importantFields = ['first_name', 'bio', 'interests', 'university', 'profile_images'];
  importantFields.forEach(field => {
    if (profile[field]) completedFields++;
  });
  score += (completedFields / importantFields.length) * 10;
  
  return Math.max(20, Math.min(95, Math.round(score)));
}

async function resyncQCS() {
  console.log('🔄 Starting QCS resync process...');
  
  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1000);
    
    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('📭 No profiles found to process');
      return;
    }
    
    console.log(`📊 Found ${profiles.length} profiles to process`);
    
    let updated = 0;
    let created = 0;
    let errors = 0;
    
    for (const profile of profiles) {
      try {
        const userId = profile.firebase_uid || profile.user_id;
        if (!userId) {
          console.log(`⚠️  Skipping profile ${profile.id} - no user ID`);
          continue;
        }
        
        // Calculate deterministic score
        const logicScore = calculateDeterministicScore(profile);
        const totalScore = logicScore; // No AI for resync
        
        // Check if QCS record exists
        const { data: existingQCS } = await supabase
          .from('qcs')
          .select('id, total_score')
          .eq('user_id', userId)
          .maybeSingle();
        
        // Upsert QCS record
        const { error: qcsError } = await supabase
          .from('qcs')
          .upsert({
            user_id: userId,
            total_score: totalScore,
            total_score_float: totalScore,
            logic_score: logicScore,
            ai_score: null,
            ai_meta: null,
            per_category: {},
            updated_at: new Date().toISOString()
          });
        
        if (qcsError) {
          console.error(`❌ QCS upsert failed for ${userId}:`, qcsError.message);
          errors++;
          continue;
        }
        
        // Update profile total_qcs
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            total_qcs: totalScore, 
            qcs_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        
        if (profileError) {
          console.error(`❌ Profile update failed for ${userId}:`, profileError.message);
          errors++;
          continue;
        }
        
        if (existingQCS) {
          updated++;
          console.log(`✅ Updated ${profile.first_name} ${profile.last_name} (${userId}): ${existingQCS.total_score} → ${totalScore}`);
        } else {
          created++;
          console.log(`🆕 Created QCS for ${profile.first_name} ${profile.last_name} (${userId}): ${totalScore}`);
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`❌ Error processing profile ${profile.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📈 Resync Summary:');
    console.log(`✅ Created: ${created} new QCS records`);
    console.log(`🔄 Updated: ${updated} existing QCS records`);
    console.log(`❌ Errors: ${errors} failed operations`);
    
    // Verify sync by checking for missing QCS records
    const { data: missingSyncCheck } = await supabase
      .from('profiles')
      .select('id, firebase_uid, user_id, first_name, last_name, total_qcs')
      .is('total_qcs', null)
      .limit(10);
    
    if (missingSyncCheck && missingSyncCheck.length > 0) {
      console.log(`\n⚠️  Warning: ${missingSyncCheck.length} profiles still have null total_qcs:`);
      missingSyncCheck.forEach(p => {
        console.log(`  - ${p.first_name} ${p.last_name} (${p.firebase_uid || p.user_id})`);
      });
    } else {
      console.log('\n✅ All profiles now have synced QCS scores!');
    }
    
  } catch (error) {
    console.error('❌ Resync failed:', error.message);
    Deno.exit(1);
  }
}

async function main() {
  console.log('🚀 QCS Data Repair & Resync Tool');
  console.log('=====================================');
  
  await resyncQCS();
  
  console.log('\n🎉 Resync completed successfully!');
  console.log('Next steps:');
  console.log('1. Test QCS calculation with a few users');
  console.log('2. Monitor logs for any remaining issues');
  console.log('3. Run health check endpoint to verify AI pipeline');
}

if (import.meta.main) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    Deno.exit(1);
  });
}