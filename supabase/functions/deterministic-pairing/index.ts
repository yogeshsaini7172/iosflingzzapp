import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deterministic hash function for seeded jitter
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generate deterministic jitter between -2.0 and +2.0
function getDeterministicJitter(user1Id: string, user2Id: string): number {
  const combined = user1Id + user2Id;
  const hash = hashString(combined);
  // Normalize to 0-1, then scale to -2.0 to +2.0
  const normalized = (hash % 10000) / 10000;
  return (normalized - 0.5) * 4.0; // Range: -2.0 to +2.0
}

// Enhanced compatibility calculation with preferences integration
function computeCompatibilityWithPreferences(
  userA: any, 
  userB: any, 
  userAPrefs: any
): { 
  deterministic_score: number; 
  physical_score: number;
  mental_score: number;
  parsing_issue: boolean; 
  debug: any; 
} {
  let parsing_issue = false;
  let debug: any = { userA_data: {}, userB_data: {}, matches: [] };
  let physicalScore = 0;
  let mentalScore = 0;
  let matchCount = 0;
  
  try {
    debug.userA_data = { profile: userA, preferences: userAPrefs };
    debug.userB_data = { profile: userB };
    
    if (!userAPrefs) {
      parsing_issue = true;
      debug.issue = "Missing user preferences data";
      return { deterministic_score: 50.0, physical_score: 0, mental_score: 0, parsing_issue, debug };
    }
    
    // Physical scoring (50 points max)
    // Height compatibility (12 points)
    if (userAPrefs.height_range_min && userAPrefs.height_range_max && userB.height) {
      const heightMatch = userB.height >= userAPrefs.height_range_min && 
                         userB.height <= userAPrefs.height_range_max;
      if (heightMatch) {
        physicalScore += 12;
        matchCount++;
        debug.matches.push("height_match");
      }
    }
    
    // Body type compatibility (12 points)
    if (userAPrefs.preferred_body_types?.length > 0 && userB.body_type) {
      const bodyMatch = userAPrefs.preferred_body_types.includes(userB.body_type);
      if (bodyMatch) {
        physicalScore += 12;
        matchCount++;
        debug.matches.push("body_type_match");
      }
    }
    
    // Skin tone compatibility (13 points)
    if (userAPrefs.preferred_skin_tone?.length > 0 && userB.skin_tone) {
      const skinMatch = userAPrefs.preferred_skin_tone.includes(userB.skin_tone);
      if (skinMatch) {
        physicalScore += 13;
        matchCount++;
        debug.matches.push("skin_tone_match");
      }
    }
    
    // Face type compatibility (13 points)
    if (userAPrefs.preferred_face_type?.length > 0 && userB.face_type) {
      const faceMatch = userAPrefs.preferred_face_type.includes(userB.face_type);
      if (faceMatch) {
        physicalScore += 13;
        matchCount++;
        debug.matches.push("face_type_match");
      }
    }
    
    // Mental scoring (50 points max)
    // Values compatibility (15 points)
    if (userAPrefs.preferred_values?.length > 0 && userB.values) {
      const valuesMatch = Array.isArray(userB.values) 
        ? userB.values.some((v: string) => userAPrefs.preferred_values.includes(v))
        : userAPrefs.preferred_values.includes(userB.values);
      if (valuesMatch) {
        mentalScore += 15;
        matchCount++;
        debug.matches.push("values_match");
      }
    }
    
    // Mindset compatibility (10 points)
    if (userAPrefs.preferred_mindset?.length > 0 && userB.mindset) {
      const mindsetMatch = Array.isArray(userB.mindset)
        ? userB.mindset.some((m: string) => userAPrefs.preferred_mindset.includes(m))
        : userAPrefs.preferred_mindset.includes(userB.mindset);
      if (mindsetMatch) {
        mentalScore += 10;
        matchCount++;
        debug.matches.push("mindset_match");
      }
    }
    
    // Personality compatibility (10 points)
    if (userAPrefs.preferred_personality_traits?.length > 0 && userB.personality_traits) {
      const personalityMatch = Array.isArray(userB.personality_traits)
        ? userB.personality_traits.some((p: string) => userAPrefs.preferred_personality_traits.includes(p))
        : userAPrefs.preferred_personality_traits.includes(userB.personality_type);
      if (personalityMatch) {
        mentalScore += 10;
        matchCount++;
        debug.matches.push("personality_match");
      }
    }
    
    // Love language compatibility (8 points)
    if (userAPrefs.preferred_love_language?.length > 0 && userB.love_language) {
      const loveLanguageMatch = userAPrefs.preferred_love_language.includes(userB.love_language);
      if (loveLanguageMatch) {
        mentalScore += 8;
        matchCount++;
        debug.matches.push("love_language_match");
      }
    }
    
    // Lifestyle compatibility (7 points)
    if (userAPrefs.preferred_lifestyle?.length > 0) {
      const userBLifestyle = userB.lifestyle ? 
        (typeof userB.lifestyle === 'string' ? JSON.parse(userB.lifestyle) : userB.lifestyle) : null;
      if (userBLifestyle) {
        const lifestyleMatch = userAPrefs.preferred_lifestyle.some((pref: string) => 
          Object.keys(userBLifestyle).includes(pref) || Object.values(userBLifestyle).includes(pref)
        );
        if (lifestyleMatch) {
          mentalScore += 7;
          matchCount++;
          debug.matches.push("lifestyle_match");
        }
      }
    }
    
    // Calculate overall compatibility
    const overallScore = Math.round((physicalScore + mentalScore) + 50); // Base 50 + weighted scores
    
    debug.match_count = matchCount;
    debug.physical_score = physicalScore;
    debug.mental_score = mentalScore;
    debug.overall_score = overallScore;
    
    return {
      deterministic_score: Math.min(100, Math.max(0, overallScore)),
      physical_score: Math.min(100, Math.max(0, physicalScore)),
      mental_score: Math.min(100, Math.max(0, mentalScore)),
      parsing_issue: false,
      debug
    };
    
  } catch (error) {
    parsing_issue = true;
    debug.calculation_error = error.message;
    return { 
      deterministic_score: 50.0, 
      physical_score: 0, 
      mental_score: 0, 
      parsing_issue, 
      debug 
    };
  }
}

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
    
    if (!user_id) {
      throw new Error('user_id is required');
    }

    console.log(`Starting deterministic pairing for user: ${user_id}`);

    // Get USER1 profile and preferences
    const { data: user1Profile, error: user1Error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (user1Error) throw user1Error;
    
    if (!user1Profile) {
      return new Response(JSON.stringify({
        success: false,
        error: "User profile not found. Please complete your profile setup first.",
        user_id: user_id
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get USER1 partner preferences
    const { data: user1Preferences, error: prefsError } = await supabaseClient
      .from('partner_preferences')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (prefsError) console.warn('Preferences fetch error:', prefsError);

    const user1QCS = user1Profile.total_qcs || 0;
    const qcsRangeMin = user1QCS - 10;
    const qcsRangeMax = user1QCS + 10;

    console.log(`USER1 QCS: ${user1QCS}, Range: [${qcsRangeMin}, ${qcsRangeMax}]`);

    // Query candidates within QCS range, excluding USER1
    const { data: candidates, error: candidatesError } = await supabaseClient
      .from('profiles')
      .select(`
        user_id, first_name, last_name, total_qcs,
        qualities, requirements, date_of_birth, gender,
        university, bio, profile_images, height, body_type,
        values, mindset, personality_type
      `)
      .gte('total_qcs', qcsRangeMin)
      .lte('total_qcs', qcsRangeMax)
      .neq('user_id', user_id)
      .eq('is_active', true)
      .not('first_name', 'is', null)
      .not('last_name', 'is', null)
      .limit(50);

    if (candidatesError) throw candidatesError;

    console.log(`Found ${candidates?.length || 0} candidates in QCS range`);

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        user1: {
          id: user_id,
          name: `${user1Profile.first_name} ${user1Profile.last_name}`.trim(),
          qcs: user1QCS,
          qcs_range: [qcsRangeMin, qcsRangeMax]
        },
        total_candidates_found: 0,
        top_candidates: [],
        message: "No candidates found in QCS range. Try again later or adjust your preferences.",
        algorithm_info: {
          base_score: 50.0,
          jitter_range: "±2.0",
          deterministic: true,
          no_random_fallback: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate deterministic compatibility for each candidate using new preferences
    const results = [];
    for (const candidate of candidates) {
      const { deterministic_score, physical_score, mental_score, parsing_issue, debug } = computeCompatibilityWithPreferences(
        user1Profile, 
        candidate, 
        user1Preferences
      );
      
      // Apply deterministic jitter
      const jitter_applied = getDeterministicJitter(user_id, candidate.user_id);
      const final_score = Math.min(100, Math.max(0, deterministic_score + jitter_applied));
      
      // Calculate age
      const age = candidate.date_of_birth 
        ? Math.floor((new Date().getTime() - new Date(candidate.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null;

      results.push({
        candidate_id: candidate.user_id,
        candidate_name: `${candidate.first_name} ${candidate.last_name}`.trim(),
        candidate_age: age,
        candidate_university: candidate.university,
        candidate_bio: candidate.bio,
        candidate_images: candidate.profile_images,
        candidate_qcs: candidate.total_qcs || 0,
        deterministic_score: Math.round(deterministic_score * 10) / 10,
        physical_score: Math.round(physical_score),
        mental_score: Math.round(mental_score),
        jitter_applied: Math.round(jitter_applied * 10) / 10,
        final_score: Math.round(final_score * 10) / 10,
        parsing_issue,
        debug_info: debug
      });
    }

    // Sort by final score (highest first)
    results.sort((a, b) => b.final_score - a.final_score);

    // Return top 10
    const top10 = results.slice(0, 10);

    console.log(`Returning top ${top10.length} candidates for user ${user_id}`);

    return new Response(JSON.stringify({
      success: true,
      user1: {
        id: user_id,
        name: `${user1Profile.first_name} ${user1Profile.last_name}`.trim(),
        qcs: user1QCS,
        qcs_range: [qcsRangeMin, qcsRangeMax]
      },
      total_candidates_found: candidates.length,
      top_candidates: top10,
      algorithm_info: {
        base_score: 50.0,
        jitter_range: "±2.0",
        deterministic: true,
        no_random_fallback: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in deterministic-pairing function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});