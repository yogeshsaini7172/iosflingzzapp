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
  qualities: any;
  requirements: any;
  age?: number;
  interests?: string[];
  relationship_goals?: string[];
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

function matchScore(req: any, qual: any): number {
  if (req === null || req === undefined) {
    return 1.0; // no requirement = always okay
  }

  // List requirement
  if (Array.isArray(req)) {
    // Check if "Any" or "All" is in the requirement list - if so, accept everything
    const hasAllOrAny = req.some(r => {
      const normalized = typeof r === 'string' ? r.toLowerCase().trim() : '';
      return normalized === 'any' || normalized === 'all';
    });
    
    if (hasAllOrAny) {
      return 1.0; // "Any"/"All" means no filter - perfect match
    }
    
    if (!qual) return 0.0;
    if (Array.isArray(qual)) {
      return req.some(r => qual.includes(r)) ? 1.0 : 0.0;
    }
    return req.includes(qual) ? 1.0 : 0.0;
  }

  // Numeric range
  if (typeof req === 'object' && req.min !== undefined && req.max !== undefined) {
    if (qual === null || qual === undefined) return 0.0;
    if (typeof qual === 'number' && qual >= req.min && qual <= req.max) {
      return 1.0;
    }
    return 0.0;
  }

  // Equality
  return qual === req ? 1.0 : 0.0;
}

function calculatePhysicalScore(userA: UserProfile, userB: UserProfile): number {
  const reqs = userA.requirements?.physical || {};
  const quals = userB.qualities?.physical || {};

  // Legacy list style
  if (Array.isArray(reqs)) {
    const haveValues: any[] = [];
    Object.values(quals).forEach(v => {
      if (Array.isArray(v)) {
        haveValues.push(...v);
      } else {
        haveValues.push(v);
      }
    });
    const matched = reqs.filter(r => haveValues.includes(r)).length;
    return reqs.length > 0 ? matched / reqs.length : 0.0;
  }

  // Dict style (weighted)
  let score = 0.0;
  Object.entries(PHYSICAL_WEIGHTS).forEach(([trait, weight]) => {
    const req = typeof reqs === 'object' ? reqs[trait] : null;
    const qual = quals[trait];
    score += matchScore(req, qual) * weight;
  });
  return score;
}

function calculateMentalScore(userA: UserProfile, userB: UserProfile): number {
  const reqs = userA.requirements?.mental || {};
  const quals = userB.qualities?.mental || {};

  // Legacy list style
  if (Array.isArray(reqs)) {
    const haveValues: any[] = [];
    Object.values(quals).forEach(v => {
      if (Array.isArray(v)) {
        haveValues.push(...v);
      } else {
        haveValues.push(v);
      }
    });
    const matched = reqs.filter(r => haveValues.includes(r)).length;
    return reqs.length > 0 ? matched / reqs.length : 0.0;
  }

  // Dict style (weighted)
  let score = 0.0;
  Object.entries(MENTAL_WEIGHTS).forEach(([trait, weight]) => {
    const req = typeof reqs === 'object' ? reqs[trait] : null;
    const qual = quals[trait];
    score += matchScore(req, qual) * weight;
  });
  return score;
}

function compatibilityScore(userA: UserProfile, userB: UserProfile) {
  const physicalA = calculatePhysicalScore(userA, userB);
  const mentalA = calculateMentalScore(userA, userB);

  const physicalB = calculatePhysicalScore(userB, userA);
  const mentalB = calculateMentalScore(userB, userA);

  const scoreA = 0.5 * physicalA + 0.5 * mentalA;
  const scoreB = 0.5 * physicalB + 0.5 * mentalB;

  const finalScore = Math.round(((scoreA + scoreB) / 2) * 100 * 100) / 100;

  console.log(`Compatibility score | userA=${userA.id} userB=${userB.id} score=${finalScore}`);

  return {
    score: finalScore,
    breakdown: {
      user_a_view: { physical: physicalA, mental: mentalA },
      user_b_view: { physical: physicalB, mental: mentalB },
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