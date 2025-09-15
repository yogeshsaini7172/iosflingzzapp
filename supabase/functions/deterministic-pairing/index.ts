import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to normalize strings for comparison
function normalizeForComparison(str: string): string {
  return str.toLowerCase()
    .replace(/[-_\s]/g, '') // Remove hyphens, underscores, spaces
    .trim();
}

// Helper function to check if arrays contain matching values (case insensitive)
function arrayContainsMatch(preferredArray: string[], candidateValue: string | string[]): boolean {
  if (!preferredArray || !candidateValue) return false;
  
  const normalizedPreferred = preferredArray.map(normalizeForComparison);
  const candidateValues = Array.isArray(candidateValue) ? candidateValue : [candidateValue];
  
  return candidateValues.some(val => {
    const normalizedCandidate = normalizeForComparison(val);
    // Check exact match first, then partial matches
    return normalizedPreferred.some(pref => 
      normalizedCandidate === pref || 
      normalizedCandidate.includes(pref) || 
      pref.includes(normalizedCandidate)
    );
  });
}

// Calculate exact match score based on user's deterministic algorithm
function calculateMatchScore(userPreferences: any, candidateAttributes: any): {
  totalScore: number;
  physicalScore: number; 
  mentalScore: number;
  matched: string[];
  notMatched: string[];
} {
  const matched: string[] = [];
  const notMatched: string[] = [];
  let physicalScore = 0;
  let mentalScore = 0;
  
  // --- PHYSICAL MATCH (max 40 points) ---
  
  // 1. Height match (10 points)
  if (userPreferences?.height_range_min && userPreferences?.height_range_max && candidateAttributes?.height) {
    if (candidateAttributes.height >= userPreferences.height_range_min && 
        candidateAttributes.height <= userPreferences.height_range_max) {
      physicalScore += 10;
      matched.push("height");
    } else {
      notMatched.push("height");
    }
  } else {
    notMatched.push("height");
  }
  
  // 2. Body type match (10 points) - case insensitive
  if (userPreferences?.preferred_body_types?.length > 0 && candidateAttributes?.body_type) {
    if (arrayContainsMatch(userPreferences.preferred_body_types, candidateAttributes.body_type)) {
      physicalScore += 10;
      matched.push("body_type");
    } else {
      notMatched.push("body_type");
    }
  } else {
    notMatched.push("body_type");
  }
  
  // 3. Skin tone match (10 points) - case insensitive
  if (userPreferences?.preferred_skin_tone?.length > 0 && candidateAttributes?.skin_tone) {
    if (arrayContainsMatch(userPreferences.preferred_skin_tone, candidateAttributes.skin_tone)) {
      physicalScore += 10;
      matched.push("skin_tone");
    } else {
      notMatched.push("skin_tone");
    }
  } else {
    notMatched.push("skin_tone");
  }
  
  // 4. Face type match (10 points) - case insensitive
  if (userPreferences?.preferred_face_type?.length > 0 && candidateAttributes?.face_type) {
    if (arrayContainsMatch(userPreferences.preferred_face_type, candidateAttributes.face_type)) {
      physicalScore += 10;
      matched.push("face_type");
    } else {
      notMatched.push("face_type");
    }
  } else {
    notMatched.push("face_type");
  }
  
  // --- MENTAL/PERSONALITY MATCH (max 40 points) ---
  
  // 1. Personality type match (10 points) - case insensitive
  if (userPreferences?.preferred_personality_traits?.length > 0 && candidateAttributes?.personality_type) {
    if (arrayContainsMatch(userPreferences.preferred_personality_traits, candidateAttributes.personality_type)) {
      mentalScore += 10;
      matched.push("personality_type");
    } else {
      notMatched.push("personality_type");
    }
  } else {
    notMatched.push("personality_type");
  }
  
  // 2. Values match (10 points) - case insensitive with format normalization
  if (userPreferences?.preferred_values?.length > 0 && candidateAttributes?.values) {
    if (arrayContainsMatch(userPreferences.preferred_values, candidateAttributes.values)) {
      mentalScore += 10;
      matched.push("values");
    } else {
      notMatched.push("values");
    }
  } else {
    notMatched.push("values");
  }
  
  // 3. Mindset match (10 points) - case insensitive with partial matching
  if (userPreferences?.preferred_mindset?.length > 0 && candidateAttributes?.mindset) {
    if (arrayContainsMatch(userPreferences.preferred_mindset, candidateAttributes.mindset)) {
      mentalScore += 10;
      matched.push("mindset");
    } else {
      notMatched.push("mindset");
    }
  } else {
    notMatched.push("mindset");
  }
  
  // 4. Relationship goals match (10 points) - case insensitive
  if (userPreferences?.preferred_relationship_goal?.length > 0 && candidateAttributes?.relationship_goals) {
    if (arrayContainsMatch(userPreferences.preferred_relationship_goal, candidateAttributes.relationship_goals)) {
      mentalScore += 10;
      matched.push("relationship_goal");
    } else {
      notMatched.push("relationship_goal");
    }
  } else {
    notMatched.push("relationship_goal");
  }
  
  // Note: Skipping interests bonus for now as we don't have preferred_interests field in partner_preferences
  
  const totalScore = physicalScore + mentalScore;
  
  return {
    totalScore,
    physicalScore,
    mentalScore,
    matched,
    notMatched
  };
}

// Compute compatibility using exact user algorithm - no baselines, no random data
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
  
  try {
    // If no preferences, return 0 scores
    if (!userAPrefs) {
      parsing_issue = true;
      return { 
        deterministic_score: 0, 
        physical_score: 0, 
        mental_score: 0, 
        parsing_issue, 
        debug: { issue: "Missing user preferences data" }
      };
    }
    
    // Calculate exact match scores using user's algorithm
    const { totalScore, physicalScore, mentalScore, matched, notMatched } = calculateMatchScore(userAPrefs, userB);
    
    // Convert to percentages (user's formula)
    const physicalMax = 40; // 4 categories × 10 points each
    const mentalMax = 40;   // 4 categories × 10 points each
    const totalMax = 80;    // physicalMax + mentalMax (excluding interests for now)
    
    const physicalPercentage = Math.round((physicalScore / physicalMax) * 100);
    const mentalPercentage = Math.round((mentalScore / mentalMax) * 100);
    const overallPercentage = Math.round((totalScore / totalMax) * 100);
    
    const debug = {
      userA_data: { profile: userA, preferences: userAPrefs },
      userB_data: { profile: userB },
      matched: matched,
      not_matched: notMatched,
      raw_scores: {
        physical_raw: physicalScore,
        mental_raw: mentalScore,
        total_raw: totalScore
      },
      score_breakdown: {
        physical_max: physicalMax,
        mental_max: mentalMax,
        total_max: totalMax,
        physical_percentage: physicalPercentage,
        mental_percentage: mentalPercentage,
        overall_percentage: overallPercentage
      }
    };
    
    return {
      deterministic_score: overallPercentage,
      physical_score: physicalPercentage,
      mental_score: mentalPercentage,
      parsing_issue: false,
      debug
    };
    
  } catch (error) {
    parsing_issue = true;
    return { 
      deterministic_score: 0, 
      physical_score: 0, 
      mental_score: 0, 
      parsing_issue, 
      debug: { calculation_error: error.message }
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

    // Query candidates within QCS range, excluding USER1, with GENDER FILTERING
    let candidatesQuery = supabaseClient
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
      .not('last_name', 'is', null);

    // GENDER FILTERING: Apply user's preferred gender filter
    if (user1Preferences?.preferred_gender?.length > 0) {
      const normalizedGenders = user1Preferences.preferred_gender
        .map((g: string) => (typeof g === 'string' ? g.toLowerCase().trim() : ''))
        .filter((g: string) => g === 'male' || g === 'female');
      console.log('Applying gender filter:', normalizedGenders);
      if (normalizedGenders.length > 0) {
        candidatesQuery = candidatesQuery.in('gender', normalizedGenders);
      }
    }

    const { data: candidates, error: candidatesError } = await candidatesQuery.limit(50);

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
          physical_max: 40,
          mental_max: 40,
          total_max: 80,
          deterministic: true,
          no_baseline_scores: true,
          no_random_data: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate deterministic compatibility for each candidate using exact user algorithm
    const results = [];
    for (const candidate of candidates) {
      const { deterministic_score, physical_score, mental_score, parsing_issue, debug } = computeCompatibilityWithPreferences(
        user1Profile, 
        candidate, 
        user1Preferences
      );
      
      // NO jitter - pure deterministic scoring as requested
      const final_score = deterministic_score;
      
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
        deterministic_score: deterministic_score,
        physical_score: physical_score,
        mental_score: mental_score,
        final_score: final_score,
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
        physical_max: 40,
        mental_max: 40,
        total_max: 80,
        deterministic: true,
        no_baseline_scores: true,
        no_random_data: true
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