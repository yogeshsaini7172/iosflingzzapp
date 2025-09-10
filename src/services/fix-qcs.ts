import { calculateQCS, updateProfileCompletion } from './qcs';
import { supabase } from "@/integrations/supabase/client";

export async function fixAllQCS() {
  const userIds = [
    '11111111-1111-1111-1111-111111111001', // Alice
    '22222222-2222-2222-2222-222222222002', // Bob  
    '33333333-3333-3333-3333-333333333003', // Charlie
    '44444444-4444-4444-4444-444444444004', // Diana
    '55555555-5555-5555-5555-555555555005'  // Eva
  ];

  console.log('🔧 Fixing QCS scores and populating qualities/requirements for all users...');
  
  for (const userId of userIds) {
    try {
      console.log(`Processing ${userId}...`);
      
      // Update profile completion first
      await updateProfileCompletion(userId);
      
      // Calculate and sync QCS
      const qcsScore = await calculateQCS(userId);
      
      // Also populate qualities and requirements if missing
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profile) {
        let qualities = {};
        let requirements = {};

        try {
          qualities = profile.qualities ? JSON.parse(profile.qualities as string) : {};
          requirements = profile.requirements ? JSON.parse(profile.requirements as string) : {};
        } catch (e) {
          console.log(`Parsing existing JSON failed for ${userId}, creating new...`);
        }

        // If qualities is empty, populate with sample data
        if (Object.keys(qualities).length === 0) {
          qualities = {
            height: profile.height || 170,
            body_type: profile.body_type || "average",
            skin_tone: profile.skin_tone || "medium",
            face_type: profile.face_type || "oval",
            personality_type: profile.personality_type || "outgoing",
            personality_traits: profile.personality_traits || ["friendly", "ambitious"],
            values: Array.isArray(profile.values) ? profile.values : (profile.values ? [profile.values] : ["family_oriented"]),
            mindset: Array.isArray(profile.mindset) ? profile.mindset : (profile.mindset ? [profile.mindset] : ["growth_mindset"]),
            relationship_goals: profile.relationship_goals || ["serious_relationship"],
            interests: profile.interests || ["music", "travel", "fitness"],
            university: profile.university || "University",
            field_of_study: profile.field_of_study || "Computer Science",
            education_level: profile.education_level || "undergraduate",
            profession: profile.profession || "Student",
            bio_length: profile.bio ? profile.bio.length : 0,
            communication_style: profile.bio && profile.bio.length > 100 ? "expressive" : "concise",
            profile_completeness: (profile.bio && profile.profile_images?.length >= 2 && profile.interests?.length >= 3) ? "detailed" : "basic"
          };
        }

        // If requirements is empty, populate with sample data
        if (Object.keys(requirements).length === 0) {
          requirements = {
            height_range_min: 150,
            height_range_max: 190,
            preferred_body_types: ["slim", "athletic", "average"],
            preferred_skin_types: [],
            preferred_face_types: [],
            preferred_gender: ["female"],
            age_range_min: 18,
            age_range_max: 30,
            preferred_personality_traits: ["outgoing", "kind"],
            preferred_values: ["family_oriented"],
            preferred_mindset: ["growth_mindset"],
            preferred_relationship_goals: ["serious_relationship"],
            preferred_interests: ["music", "travel"],
            preferred_love_languages: ["quality_time"],
            preferred_communication_style: [],
            preferred_lifestyle: ["active"],
            min_shared_interests: 2,
            personality_compatibility: "moderate",
            lifestyle_compatibility: "important"
          };
        }

        // Update the profile with populated qualities and requirements
        await supabase
          .from("profiles")
          .update({
            qualities: JSON.stringify(qualities),
            requirements: JSON.stringify(requirements)
          })
          .eq("user_id", userId);

        console.log(`✅ QCS updated for ${userId}: ${qcsScore} points (qualities and requirements populated)`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${userId}:`, error);
    }
  }
  
  console.log('🎉 QCS fix complete! All profiles now have proper qualities and requirements.');
}

// Auto-run fix on import for demo
fixAllQCS();