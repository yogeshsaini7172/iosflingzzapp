import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompatibilityRequest {
  user1_id: string;
  user2_id: string;
}

interface UserProfile {
  id: string;
  qualities: {
    physical?: Record<string, any>;
    mental?: Record<string, any>;
  };
  requirements: {
    physical?: Record<string, any> | any[];
    mental?: Record<string, any> | any[];
  };
  age?: number;
  interests?: string[];
  relationship_goals?: string[];
  personality_traits?: string[];
  values_array?: string[];
  mindset_array?: string[];
}

const PHYSICAL_WEIGHTS = {
  skin_type: 0.2,
  body_type: 0.4,
  height: 0.3,
  face_type: 0.1,
};

const MENTAL_WEIGHTS = {
  values: 0.4,
  personality: 0.3,
  interests: 0.3,
};

// Optimized: Memoized match scoring function
const matchScoreCache = new Map<string, number>();

function getCacheKey(req: any, qual: any): string {
  return `${JSON.stringify(req)}_${JSON.stringify(qual)}`;
}

function matchScore(req: any, qual: any): number {
  // Check cache first
  const cacheKey = getCacheKey(req, qual);
  if (matchScoreCache.has(cacheKey)) {
    return matchScoreCache.get(cacheKey)!;
  }
  
  let score: number;
  // No requirement = always acceptable
  if (req === null || req === undefined) {
    score = 1.0;
  }
  // List requirement
  else if (Array.isArray(req)) {
    // Check if "Any" or "All" is in the requirement list
    const hasAllOrAny = req.some(r => {
      const normalized = typeof r === 'string' ? r.toLowerCase().trim() : '';
      return normalized === 'any' || normalized === 'all';
    });
    
    if (hasAllOrAny) {
      score = 1.0; // "Any"/"All" means no filter
    } else if (!qual) {
      score = 0.0;
    } else if (Array.isArray(qual)) {
      score = req.some(r => qual.includes(r)) ? 1.0 : 0.0;
    } else {
      score = req.includes(qual) ? 1.0 : 0.0;
    }
  }
  // Numeric range
  else if (typeof req === 'object' && req.min !== undefined && req.max !== undefined) {
    if (qual === null || qual === undefined) {
      score = 0.0;
    } else if (typeof qual === 'number' && qual >= req.min && qual <= req.max) {
      score = 1.0;
    } else {
      score = 0.0;
    }
  }
  // Equality
  else {
    score = qual === req ? 1.0 : 0.0;
  }
  
  // Cache the result
  matchScoreCache.set(cacheKey, score);
  return score;
}

// Optimized: Physical compatibility scoring
function calculatePhysicalScore(userA: UserProfile, userB: UserProfile): number {
  const reqs = userA.requirements?.physical || {};
  const quals = userB.qualities?.physical || {};

  // Legacy array format
  if (Array.isArray(reqs)) {
    if (reqs.length === 0) return 1.0;
    
    const qualValues = new Set<any>();
    for (const val of Object.values(quals)) {
      if (Array.isArray(val)) {
        val.forEach(v => qualValues.add(v));
      } else {
        qualValues.add(val);
      }
    }
    
    const matched = reqs.filter(r => qualValues.has(r)).length;
    return matched / reqs.length;
  }

  // Object format (weighted) - User A's requirements vs User B's qualities
  if (typeof reqs !== 'object') return 0.0;
  
  let score = 0.0;
  for (const [trait, weight] of Object.entries(PHYSICAL_WEIGHTS)) {
    const req = reqs[trait];
    const qual = quals[trait];
    score += matchScore(req, qual) * weight;
  }
  return score;
}

// Optimized: Mental compatibility scoring  
function calculateMentalScore(userA: UserProfile, userB: UserProfile): number {
  const reqs = userA.requirements?.mental || {};
  const quals = userB.qualities?.mental || {};

  // Legacy array format
  if (Array.isArray(reqs)) {
    if (reqs.length === 0) return 1.0;
    
    const qualValues = new Set<any>();
    for (const val of Object.values(quals)) {
      if (Array.isArray(val)) {
        val.forEach(v => qualValues.add(v));
      } else {
        qualValues.add(val);
      }
    }
    
    const matched = reqs.filter(r => qualValues.has(r)).length;
    return matched / reqs.length;
  }

  // Object format (weighted) - User A's requirements vs User B's qualities
  if (typeof reqs !== 'object') return 0.0;
  
  let score = 0.0;
  for (const [trait, weight] of Object.entries(MENTAL_WEIGHTS)) {
    const req = reqs[trait];
    const qual = quals[trait];
    score += matchScore(req, qual) * weight;
  }
  return score;
}

// Optimized: Bidirectional compatibility calculation
// User A's requirements match User B's qualities AND vice versa
function compatibilityScore(userA: UserProfile, userB: UserProfile) {
  // Calculate how well B matches A's requirements
  const physicalA = calculatePhysicalScore(userA, userB); // A's reqs vs B's quals
  const mentalA = calculateMentalScore(userA, userB);     // A's reqs vs B's quals

  // Calculate how well A matches B's requirements  
  const physicalB = calculatePhysicalScore(userB, userA); // B's reqs vs A's quals
  const mentalB = calculateMentalScore(userB, userA);     // B's reqs vs A's quals

  // Combined scores (50% physical, 50% mental for each direction)
  const scoreA = 0.5 * physicalA + 0.5 * mentalA;
  const scoreB = 0.5 * physicalB + 0.5 * mentalB;

  // Final bidirectional score (average of both directions)
  const finalScore = Math.round(((scoreA + scoreB) / 2) * 100 * 100) / 100;

  console.log(`✅ Compatibility | A=${userA.id} B=${userB.id} | Final=${finalScore} | A→B=${Math.round(scoreA*100)} B→A=${Math.round(scoreB*100)}`);

  return {
    score: finalScore,
    breakdown: {
      user_a_view: { physical: Math.round(physicalA * 100), mental: Math.round(mentalA * 100) },
      user_b_view: { physical: Math.round(physicalB * 100), mental: Math.round(mentalB * 100) },
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error('User not authenticated');

    const { user1_id, user2_id }: CompatibilityRequest = await req.json();

    // Optimized: Check cache first
    const { data: cachedScore } = await supabaseClient
      .from('compatibility_scores')
      .select('compatibility_score, calculated_at')
      .or(`and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`)
      .single();
    
    // Return cached score if recent (< 24 hours old)
    if (cachedScore && new Date(cachedScore.calculated_at).getTime() > Date.now() - 86400000) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          score: cachedScore.compatibility_score,
          cached: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fetch both user profiles
    const { data: users, error } = await supabaseClient
      .from('profiles')
      .select('user_id, qualities, requirements, age, interests, relationship_goals')
      .in('user_id', [user1_id, user2_id]);

    if (error) throw error;
    if (!users || users.length !== 2) throw new Error('Users not found');

    const userA = users.find(u => u.user_id === user1_id)!;
    const userB = users.find(u => u.user_id === user2_id)!;

    const result = compatibilityScore(
      { id: userA.user_id, ...userA },
      { id: userB.user_id, ...userB }
    );

    // Store compatibility score
    await supabaseClient.from('compatibility_scores').upsert({
      user1_id,
      user2_id,
      compatibility_score: Math.round(result.score),
      physical_score: Math.round(result.breakdown.user_a_view.physical * 100),
      mental_score: Math.round(result.breakdown.user_a_view.mental * 100),
      calculated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in compatibility-scoring function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});