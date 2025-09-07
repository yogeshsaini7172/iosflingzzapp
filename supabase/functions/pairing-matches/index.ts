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
  // Simplified compatibility calculation
  // In production, this would use the full algorithm from compatibility-scoring function
  const baseScore = 50 + Math.random() * 50;
  
  return {
    score: Math.round(baseScore),
    breakdown: {
      physical: Math.random() * 100,
      mental: Math.random() * 100,
      interests: Math.random() * 100
    }
  };
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