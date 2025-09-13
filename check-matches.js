// Check if there are matches that should have chat rooms
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cchvsqeqiavhanurnbeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatches() {
  console.log('🔍 Checking for existing matches...');
  
  try {
    // Check enhanced_matches table
    console.log('\n1️⃣ Checking enhanced_matches...');
    const { data: enhancedMatches, error: enhancedError } = await supabase
      .from('enhanced_matches')
      .select('*')
      .limit(10);
    
    if (enhancedError) {
      console.log('❌ Enhanced matches query failed:', enhancedError.message);
    } else {
      console.log(`✅ Found ${enhancedMatches?.length || 0} enhanced matches`);
      if (enhancedMatches && enhancedMatches.length > 0) {
        console.log('📋 Sample enhanced match:', {
          id: enhancedMatches[0].id,
          user1_id: enhancedMatches[0].user1_id,
          user2_id: enhancedMatches[0].user2_id,
          status: enhancedMatches[0].status
        });
      }
    }
    
    // Check legacy matches table
    console.log('\n2️⃣ Checking legacy matches...');
    const { data: legacyMatches, error: legacyError } = await supabase
      .from('matches')
      .select('*')
      .limit(10);
    
    if (legacyError) {
      console.log('❌ Legacy matches query failed:', legacyError.message);
    } else {
      console.log(`✅ Found ${legacyMatches?.length || 0} legacy matches`);
      if (legacyMatches && legacyMatches.length > 0) {
        console.log('📋 Sample legacy match:', {
          id: legacyMatches[0].id,
          liker_id: legacyMatches[0].liker_id,
          liked_id: legacyMatches[0].liked_id
        });
      }
    }
    
    // Check profiles to see if there are users
    console.log('\n3️⃣ Checking profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('firebase_uid, first_name, last_name')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Profiles query failed:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} user profiles`);
      if (profiles && profiles.length > 0) {
        console.log('👤 Sample profile:', {
          firebase_uid: profiles[0].firebase_uid,
          name: `${profiles[0].first_name} ${profiles[0].last_name}`
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkMatches();