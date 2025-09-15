import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PairingRequest {
  limit?: number;
  seen_ids?: string[];
}

async function resetIfNeeded(supabaseClient: any, userId: string) {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('last_reset, subscription_tier')
    .eq('user_id', userId)
    .single();

  if (!profile) return;

  const lastReset = new Date(profile.last_reset);
  const now = new Date();
  const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceReset >= 1) {
    // Reset daily limits
    const subscriptionLimits = {
      free: { swipes: 20, pairing: 1, blinddate: 0 },
      basic: { swipes: -1, pairing: 10, blinddate: 2 },
      plus: { swipes: -1, pairing: 15, blinddate: 4 },
      premium: { swipes: -1, pairing: 20, blinddate: -1 }
    };

    const tier = profile.subscription_tier || 'free';
    const limits = subscriptionLimits[tier as keyof typeof subscriptionLimits] || subscriptionLimits.free;

    await supabaseClient
      .from('profiles')
      .update({
        swipes_left: limits.swipes,
        pairing_requests_left: limits.pairing,
        blinddate_requests_left: limits.blinddate,
        daily_outgoing_matches: 0,
        daily_incoming_matches: 0,
        last_reset: now.toISOString()
      })
      .eq('user_id', userId);
  }
}

async function calculateCompatibilityScore(userA: any, userB: any): Promise<{ score: number; breakdown: any }> {
  let totalScore = 0;
  let matches = 0;
  
  try {
    // Parse qualities and requirements
    const userAQualities = typeof userA.qualities === 'string' ? JSON.parse(userA.qualities) : userA.qualities;
    const userARequirements = typeof userA.requirements === 'string' ? JSON.parse(userA.requirements) : userA.requirements;
    const userBQualities = typeof userB.qualities === 'string' ? JSON.parse(userB.qualities) : userB.qualities;
    const userBRequirements = typeof userB.requirements === 'string' ? JSON.parse(userB.requirements) : userB.requirements;
    
    console.log('User A Requirements:', userARequirements);
    console.log('User B Qualities:', userBQualities);
    
    // Physical compatibility: Does User A's height requirements match User B's height?
    let physicalScore = 50;
    if (userARequirements?.height_range_min && userARequirements?.height_range_max && userBQualities?.height) {
      const heightMatch = userBQualities.height >= userARequirements.height_range_min && 
                         userBQualities.height <= userARequirements.height_range_max;
      if (heightMatch) {
        physicalScore += 25;
        matches++;
      }
    }
    
    // Body type compatibility
    if (userARequirements?.preferred_body_types?.length > 0 && userBQualities?.body_type) {
      const bodyMatch = userARequirements.preferred_body_types.includes(userBQualities.body_type) ||
                       userARequirements.preferred_body_types.includes('Any');
      if (bodyMatch) {
        physicalScore += 25;
        matches++;
      }
    }
    
    // Values compatibility: Does User A want User B's values?
    let valuesScore = 50;
    if (userARequirements?.preferred_values?.length > 0 && userBQualities?.values) {
      const valuesMatch = userARequirements.preferred_values.includes(userBQualities.values);
      if (valuesMatch) {
        valuesScore += 50;
        matches++;
      }
    }
    
    // Personality compatibility
    let personalityScore = 50;
    if (userARequirements?.preferred_personality?.length > 0 && userBQualities?.personality_type) {
      const personalityMatch = userARequirements.preferred_personality.includes(userBQualities.personality_type);
      if (personalityMatch) {
        personalityScore += 50;
        matches++;
      }
    }
    
    // Mindset compatibility
    let mindsetScore = 50;
    if (userARequirements?.preferred_mindset?.length > 0 && userBQualities?.mindset) {
      const mindsetMatch = userARequirements.preferred_mindset.includes(userBQualities.mindset);
      if (mindsetMatch) {
        mindsetScore += 50;
        matches++;
      }
    }
    
    // Calculate mutual compatibility (both directions)
    const userAToB = (physicalScore + valuesScore + personalityScore + mindsetScore) / 4;
    
    // Now check User B's requirements against User A's qualities
    let reverseMutualScore = 50;
    if (userBRequirements?.height_range_min && userBRequirements?.height_range_max && userAQualities?.height) {
      const reverseHeightMatch = userAQualities.height >= userBRequirements.height_range_min && 
                                userAQualities.height <= userBRequirements.height_range_max;
      if (reverseHeightMatch) reverseMutualScore += 12.5;
    }
    
    if (userBRequirements?.preferred_body_types?.length > 0 && userAQualities?.body_type) {
      const reverseBodyMatch = userBRequirements.preferred_body_types.includes(userAQualities.body_type);
      if (reverseBodyMatch) reverseMutualScore += 12.5;
    }
    
    if (userBRequirements?.preferred_values?.length > 0 && userAQualities?.values) {
      const reverseValuesMatch = userBRequirements.preferred_values.includes(userAQualities.values);
      if (reverseValuesMatch) reverseMutualScore += 12.5;
    }
    
    if (userBRequirements?.preferred_personality?.length > 0 && userAQualities?.personality_type) {
      const reversePersonalityMatch = userBRequirements.preferred_personality.includes(userAQualities.personality_type);
      if (reversePersonalityMatch) reverseMutualScore += 12.5;
    }
    
    // Final score is average of both directions (mutual compatibility)
    totalScore = (userAToB + reverseMutualScore) / 2;
    
    console.log(`Compatibility: User A->B: ${userAToB}, User B->A: ${reverseMutualScore}, Final: ${totalScore}`);
    
    return {
      score: Math.min(100, Math.max(0, Math.round(totalScore))),
      breakdown: {
        physical: physicalScore,
        values: valuesScore,
        personality: personalityScore,
        mindset: mindsetScore,
        mutual: reverseMutualScore,
        matches: matches
      }
    };
  } catch (error) {
    console.error('Error calculating compatibility:', error);
    // Fallback to random score
    return {
      score: 50 + Math.random() * 30,
      breakdown: {
        physical: 50,
        values: 50,
        personality: 50,
        mindset: 50,
        mutual: 50,
        matches: 0
      }
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

    // REMOVED AUTH: Authentication check removed temporarily
    // For demo purposes, we'll use a fixed user ID from the request body
    const requestBody = await req.json();
    const user = { id: requestBody.user_id || '11111111-1111-1111-1111-111111111001' }; // Default to Alice's ID

    const { limit = 10, seen_ids = [], user_id }: PairingRequest & { user_id?: string } = requestBody;

    // Reset daily limits if needed
    await resetIfNeeded(supabaseClient, user.id);

    // Get user profile and check pairing limits
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    if (profile.pairing_requests_left === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'LIMIT_REACHED', message: 'No pairing requests left for today.' }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get blocked/ghosted users to exclude
    const { data: blockedUsers, error: blockError } = await supabaseClient
      .from('user_interactions')
      .select('target_user_id, interaction_type, expires_at')
      .eq('user_id', user.id)
      .in('interaction_type', ['ghost', 'bench']);

    const activeBlockedUserIds = (blockedUsers || []).filter(interaction => {
      if (interaction.interaction_type === 'bench') {
        return true; // Bench is permanent
      }
      if (interaction.interaction_type === 'ghost' && interaction.expires_at) {
        return new Date(interaction.expires_at) > new Date(); // Ghost is active if not expired
      }
      return false;
    }).map(interaction => interaction.target_user_id);

    // Get already swiped users to exclude
    const { data: swipedUsers, error: swipeError } = await supabaseClient
      .from('enhanced_swipes')
      .select('target_user_id')
      .eq('user_id', user.id);

    // Build exclusion list
    const excludedIds = [
      user.id,
      ...activeBlockedUserIds,
      ...(swipedUsers?.map(s => s.target_user_id) || []),
      ...seen_ids
    ];

    // Get user's partner preferences for gender filtering
    const { data: userPreferences } = await supabaseClient
      .from('partner_preferences')
      .select('preferred_gender')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get potential candidates (excluding blocked users, already swiped, etc.)
    let candidatesQuery = supabaseClient
      .from('profiles')
      .select(`
        user_id, first_name, last_name, 
        date_of_birth, gender, location, bio, 
        profile_images, interests, university, major,
        height, relationship_goals, lifestyle, 
        personality_type, humor_type, love_language,
        total_qcs, qualities, requirements
      `)
      .eq('is_active', true)
      .not('user_id', 'in', `(${excludedIds.join(',')})`);

    // GENDER FILTERING: Apply user's preferred gender filter
    if (userPreferences?.preferred_gender?.length > 0) {
      console.log('🚻 Applying gender filter:', userPreferences.preferred_gender);
      const normalizedGenders = userPreferences.preferred_gender
        .map((g: string) => (typeof g === 'string' ? g.toLowerCase().trim() : ''))
        .filter((g: string) => g === 'male' || g === 'female');
      if (normalizedGenders.length > 0) {
        candidatesQuery = candidatesQuery.in('gender', normalizedGenders);
      }
    }

    const { data: candidates, error: candidatesError } = await candidatesQuery.limit(limit * 2);

    if (candidatesError) throw candidatesError;

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'NO_CANDIDATES', message: 'No new candidates available.' }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate compatibility scores and format results
    const results = [];
    for (const candidate of candidates.slice(0, limit)) {
      const { score, breakdown } = await calculateCompatibilityScore(profile, candidate);
      
      // Calculate age from date_of_birth
      const candidateAge = candidate.date_of_birth 
        ? Math.floor((new Date().getTime() - new Date(candidate.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : 22;
      
      results.push({
        candidate: {
          id: candidate.user_id,
          name: `${candidate.first_name} ${candidate.last_name}`.trim(),
          age: candidateAge,
          gender: candidate.gender,
          location: candidate.location,
          bio: candidate.bio,
          profile_images: candidate.profile_images,
          interests: candidate.interests,
          university: candidate.university,
          major: candidate.major,
          total_qcs: candidate.total_qcs || 750
        },
        score,
        details: breakdown
      });
    }

    // Deduct one pairing request
    const newPairingLeft = Math.max(0, profile.pairing_requests_left - 1);
    await supabaseClient
      .from('profiles')
      .update({ pairing_requests_left: newPairingLeft })
      .eq('user_id', user.id);

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);

    console.log(`Pairing delivered | user=${user.id} | candidates=${results.length}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        candidates: results,
        remaining_pairings: newPairingLeft,
        seen_ids: seen_ids
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in pairing-matches function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});