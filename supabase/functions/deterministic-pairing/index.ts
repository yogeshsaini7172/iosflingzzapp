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

// Deterministic compatibility calculation (no random fallback)
function computeCompatibility(userA: any, userB: any): { 
  deterministic_score: number; 
  parsing_issue: boolean; 
  debug: any; 
} {
  let parsing_issue = false;
  let debug: any = { userA_data: {}, userB_data: {}, matches: [] };
  let totalScore = 50.0; // Base score
  let matchCount = 0;
  
  try {
    // Parse qualities and requirements safely
    let userAQualities, userARequirements, userBQualities, userBRequirements;
    
    try {
      userAQualities = typeof userA.qualities === 'string' ? JSON.parse(userA.qualities) : (userA.qualities || {});
      userARequirements = typeof userA.requirements === 'string' ? JSON.parse(userA.requirements) : (userA.requirements || {});
      userBQualities = typeof userB.qualities === 'string' ? JSON.parse(userB.qualities) : (userB.qualities || {});
      userBRequirements = typeof userB.requirements === 'string' ? JSON.parse(userB.requirements) : (userB.requirements || {});
    } catch (parseError) {
      parsing_issue = true;
      debug.parsing_error = parseError.message;
      return { deterministic_score: 50.0, parsing_issue, debug };
    }
    
    debug.userA_data = { qualities: userAQualities, requirements: userARequirements };
    debug.userB_data = { qualities: userBQualities, requirements: userBRequirements };
    
    // Check if we have meaningful data
    const hasUserAReqs = userARequirements && Object.keys(userARequirements).length > 0;
    const hasUserBQualities = userBQualities && Object.keys(userBQualities).length > 0;
    const hasUserBReqs = userBRequirements && Object.keys(userBRequirements).length > 0;
    const hasUserAQualities = userAQualities && Object.keys(userAQualities).length > 0;
    
    if (!hasUserAReqs || !hasUserBQualities) {
      parsing_issue = true;
      debug.issue = "Missing requirements or qualities data";
      return { deterministic_score: 50.0, parsing_issue, debug };
    }
    
    // Height compatibility (User A wants User B)
    if (userARequirements.height_range_min && userARequirements.height_range_max && userBQualities.height) {
      const heightMatch = userBQualities.height >= userARequirements.height_range_min && 
                         userBQualities.height <= userARequirements.height_range_max;
      if (heightMatch) {
        totalScore += 10;
        matchCount++;
        debug.matches.push("height_match");
      }
    }
    
    // Body type compatibility
    if (userARequirements.preferred_body_types?.length > 0 && userBQualities.body_type) {
      const bodyMatch = userARequirements.preferred_body_types.includes(userBQualities.body_type) ||
                       userARequirements.preferred_body_types.includes('Any');
      if (bodyMatch) {
        totalScore += 10;
        matchCount++;
        debug.matches.push("body_type_match");
      }
    }
    
    // Values compatibility
    if (userARequirements.preferred_values?.length > 0 && userBQualities.values) {
      const valuesMatch = userARequirements.preferred_values.includes(userBQualities.values);
      if (valuesMatch) {
        totalScore += 15;
        matchCount++;
        debug.matches.push("values_match");
      }
    }
    
    // Personality compatibility
    if (userARequirements.preferred_personality?.length > 0 && userBQualities.personality_type) {
      const personalityMatch = userARequirements.preferred_personality.includes(userBQualities.personality_type);
      if (personalityMatch) {
        totalScore += 15;
        matchCount++;
        debug.matches.push("personality_match");
      }
    }
    
    // Mutual compatibility (User B wants User A)
    if (hasUserBReqs && hasUserAQualities) {
      // Reverse height check
      if (userBRequirements.height_range_min && userBRequirements.height_range_max && userAQualities.height) {
        const reverseHeightMatch = userAQualities.height >= userBRequirements.height_range_min && 
                                  userAQualities.height <= userBRequirements.height_range_max;
        if (reverseHeightMatch) {
          totalScore += 5;
          matchCount++;
          debug.matches.push("reverse_height_match");
        }
      }
      
      // Reverse values check
      if (userBRequirements.preferred_values?.length > 0 && userAQualities.values) {
        const reverseValuesMatch = userBRequirements.preferred_values.includes(userAQualities.values);
        if (reverseValuesMatch) {
          totalScore += 5;
          matchCount++;
          debug.matches.push("reverse_values_match");
        }
      }
    }
    
    debug.match_count = matchCount;
    debug.base_score = totalScore;
    
    return {
      deterministic_score: Math.min(100, Math.max(0, totalScore)),
      parsing_issue: false,
      debug
    };
    
  } catch (error) {
    parsing_issue = true;
    debug.calculation_error = error.message;
    return { deterministic_score: 50.0, parsing_issue, debug };
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

    // Get USER1 profile
    const { data: user1Profile, error: user1Error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (user1Error) throw user1Error;

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
        university, bio, profile_images
      `)
      .gte('total_qcs', qcsRangeMin)
      .lte('total_qcs', qcsRangeMax)
      .neq('user_id', user_id)
      .eq('is_active', true)
      .limit(50);

    if (candidatesError) throw candidatesError;

    console.log(`Found ${candidates?.length || 0} candidates in QCS range`);

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        user1: {
          id: user_id,
          qcs: user1QCS,
          qcs_range: [qcsRangeMin, qcsRangeMax]
        },
        candidates: [],
        message: "No candidates found in QCS range"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate deterministic compatibility for each candidate
    const results = [];
    for (const candidate of candidates) {
      const { deterministic_score, parsing_issue, debug } = computeCompatibility(user1Profile, candidate);
      
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
        candidate_qcs: candidate.total_qcs || 0,
        deterministic_score: Math.round(deterministic_score * 10) / 10,
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