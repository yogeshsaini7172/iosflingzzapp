import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Scoring weights
const physicalWeights: Record<string, number> = {
  fit: 20, athletic: 20, tall: 15, average: 10,
  short: 8, weak: 5, obese: 3, healthy: 18
};

const mentalWeights: Record<string, number> = {
  calm: 20, logical: 20, ambitious: 15, confident: 15,
  creative: 12, adventurous: 12, empathetic: 15,
  nervous: 5, stressed: 5, aggressive: -10, insecure: -8
};

const correlations: Record<string, { adjustment: number; behavior: string }> = {
  'fit,calm': { adjustment: 12, behavior: 'Balanced, disciplined' },
  'fit,ambitious': { adjustment: 10, behavior: 'Disciplined achiever' },
  'tall,aggressive': { adjustment: -20, behavior: 'Dominant, volatile' },
  'average,ambitious': { adjustment: 8, behavior: 'Determined, hardworking' },
  'short,confident': { adjustment: 15, behavior: 'Resilient, self-assured' },
  'athletic,adventurous': { adjustment: 10, behavior: 'Energetic explorer' },
  'weak,nervous': { adjustment: -25, behavior: 'Low confidence, unstable' },
  'obese,stressed': { adjustment: -20, behavior: 'Health & stress risks' },
  'fit,empathetic': { adjustment: 15, behavior: 'Supportive leader' },
  'healthy,creative': { adjustment: 12, behavior: 'Innovative thinker' }
};

const personas: Record<string, string[]> = {
  'Reliable Partner': ['fit', 'calm', 'logical'],
  'Dreamer': ['average', 'ambitious', 'creative'],
  'Controller': ['tall', 'aggressive', 'confident'],
  'Explorer': ['athletic', 'adventurous', 'curious'],
  'Thinker': ['logical', 'calm', 'introvert'],
  'Leader': ['tall', 'confident', 'ambitious'],
  'Unstable': ['weak', 'nervous', 'stressed'],
  'Caregiver': ['empathetic', 'calm', 'supportive'],
  'Charmer': ['confident', 'creative', 'adventurous'],
  'Workaholic': ['ambitious', 'stressed', 'logical'],
  'Visionary': ['creative', 'logical', 'ambitious'],
  'Social Butterfly': ['adventurous', 'confident', 'extrovert'],
  'Stoic': ['fit', 'calm', 'introvert'],
  'Overthinker': ['logical', 'nervous', 'stressed'],
  'Free Spirit': ['creative', 'adventurous', 'empathetic']
};

const positiveWords = ['love', 'kind', 'happy', 'strong', 'caring', 'supportive', 'honest'];
const negativeWords = ['hate', 'angry', 'toxic', 'lazy', 'sad', 'jealous', 'unstable'];

// Apply weight with diminishing returns
function applyWeight(score: number, weight: number): number {
  return score + Math.floor(weight * (1 - (score / 200)));
}

// Rule-based scoring
function ruleBasedScore(physical: string, mental: string, description: string) {
  let score = 50;
  const physicalTerms = physical.toLowerCase().replace(/,/g, '').split(/\s+/);
  const mentalTerms = mental.toLowerCase().replace(/,/g, '').split(/\s+/);
  const behaviors: string[] = [];

  // Apply base weights
  physicalTerms.forEach(term => {
    if (physicalWeights[term]) {
      score = applyWeight(score, physicalWeights[term]);
    }
  });

  mentalTerms.forEach(term => {
    if (mentalWeights[term]) {
      score = applyWeight(score, mentalWeights[term]);
    }
  });

  // Apply correlations
  physicalTerms.forEach(pTerm => {
    mentalTerms.forEach(mTerm => {
      const key = `${pTerm},${mTerm}`;
      if (correlations[key]) {
        score = applyWeight(score, correlations[key].adjustment);
        behaviors.push(correlations[key].behavior);
      }
    });
  });

  // Description analysis
  const descLength = description.split(/\s+/).length;
  if (descLength > 40) {
    score = applyWeight(score, 10);
    behaviors.push('Expressive communicator');
  } else if (descLength < 10) {
    score = applyWeight(score, -10);
    behaviors.push('Reserved / vague');
  }

  // Sentiment analysis
  const descLower = description.toLowerCase();
  if (positiveWords.some(word => descLower.includes(word))) {
    score = applyWeight(score, 8);
    behaviors.push('Positive outlook');
  }
  if (negativeWords.some(word => descLower.includes(word))) {
    score = applyWeight(score, -12);
    behaviors.push('Negative tendencies');
  }

  return { score: Math.max(0, Math.min(100, score)), behaviors };
}

// Assign persona
function assignPersona(physical: string, mental: string): string {
  const combined = `${physical} ${mental}`.toLowerCase();
  let bestMatch = 'Undefined';
  let bestScore = 0;

  Object.entries(personas).forEach(([persona, traits]) => {
    const matchCount = traits.filter(trait => combined.includes(trait)).length;
    if (matchCount > bestScore) {
      bestMatch = persona;
      bestScore = matchCount;
    }
  });

  return bestMatch;
}

// AI refinement using OpenAI
async function aiRefinement(
  physical: string, 
  mental: string, 
  description: string, 
  rawScore: number, 
  behaviors: string[], 
  persona: string
) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 400,
        messages: [
          {
            role: 'system',
            content: 'You are a psychologist bot. Refine scores with reasoning.'
          },
          {
            role: 'user',
            content: `Physical: ${physical}\nMental: ${mental}\nDescription: ${description}\nRaw Score: ${rawScore}\nBehaviors: ${behaviors.join(', ')}\nPersona: ${persona}\n\nReturn JSON:\n{"final_score": number, "reason": "string", "persona": "${persona}"}`
          }
        ],
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('AI refinement error:', error);
    return { final_score: rawScore, reason: 'AI offline', persona };
  }
}

// AI predictive scoring
async function aiPredictive(physical: string, mental: string, description: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 400,
        messages: [
          {
            role: 'system',
            content: 'You are a psychologist bot that predicts quality independently.'
          },
          {
            role: 'user',
            content: `Physical: ${physical}\nMental: ${mental}\nDescription: ${description}\n\nReturn JSON:\n{"predicted_score": number, "insights": "string", "red_flags": "string"}`
          }
        ],
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Normalize score
    if (result.predicted_score !== null && result.predicted_score >= 0 && result.predicted_score <= 10) {
      result.predicted_score = Math.floor(result.predicted_score * 10);
    }
    result.predicted_score = Math.max(0, Math.min(100, result.predicted_score || 0));
    
    return result;
  } catch (error) {
    console.error('AI predictive error:', error);
    return { predicted_score: null, insights: 'AI offline', red_flags: '' };
  }
}

// Main scoring pipeline
async function finalCustomerScoring(physical: string, mental: string, description: string) {
  const ruleResult = ruleBasedScore(physical, mental, description);
  const persona = assignPersona(physical, mental);

  const aiRuleResult = await aiRefinement(
    physical, mental, description, 
    ruleResult.score, ruleResult.behaviors, persona
  );

  const aiPredictiveResult = await aiPredictive(physical, mental, description);

  return {
    rule_based: {
      ...aiRuleResult,
      base_score: ruleResult.score,
      behaviors: ruleResult.behaviors,
      persona_detected: persona
    },
    ai_based: aiPredictiveResult,
    final_judgment: 'Use both scores + personas for ranking decisions'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Firebase ID token from Authorization header
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');

    if (!idToken) {
      return new Response(JSON.stringify({ error: 'No token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate Firebase issuer/audience and extract UID safely (base64url decode)
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    try {
      if (!serviceAccountJson) throw new Error('Firebase service account not configured');
      const serviceAccount = JSON.parse(serviceAccountJson);
      const projectId = serviceAccount.project_id as string;

      const parts = idToken.split('.');
      if (parts.length < 2) throw new Error('Malformed token');
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
      const payload = JSON.parse(atob(base64));

      const expectedIss = `https://securetoken.google.com/${projectId}`;
      const issOk = typeof payload.iss === 'string' && payload.iss === expectedIss;
      const audOk = typeof payload.aud === 'string' && payload.aud === projectId;
      const subOk = typeof payload.sub === 'string' && payload.sub.length > 0;
      if (!issOk || !audOk || !subOk) {
        throw new Error('Invalid token claims');
      }

      var userId = payload.sub as string;
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read optional scoring inputs from body
    const { physical, mental, description } = await req.json();

    // Get scoring based on provided data or fetch from profile
    let physicalData = physical;
    let mentalData = mental; 
    let descriptionData = description;

    if (!physicalData || !mentalData || !descriptionData) {
      // Fetch profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('bio, body_type, personality_type, interests, height')
        .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`)
        .single();

      if (error) throw error;

      // Generate data from profile if not provided
      physicalData = physicalData || `${profile.body_type || 'average'} ${profile.height ? (profile.height > 170 ? 'tall' : 'average') : 'average'}`;
      mentalData = mentalData || `${profile.personality_type || 'average'} ${profile.interests?.includes('fitness') ? 'ambitious' : 'calm'}`;
      descriptionData = descriptionData || profile.bio || 'No description available';
    }

    console.log('Scoring for user:', userId, { physicalData, mentalData, descriptionData });

    const scoringResult = await finalCustomerScoring(physicalData, mentalData, descriptionData);

    // Update QCS in database
    const finalScore = scoringResult.rule_based.final_score || scoringResult.rule_based.base_score || 50;
    
    const { error: qcsError } = await supabase
      .from('qcs')
      .upsert({
        user_id: userId,
        profile_score: Math.floor(finalScore * 0.4),
        college_tier: 85, // Default tier score
        personality_depth: Math.floor(finalScore * 0.3),
        behavior_score: Math.floor(finalScore * 0.3)
      });

    if (qcsError) {
      console.error('Error updating QCS:', qcsError);
    }

    // Sync to profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ total_qcs: finalScore })
      .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`);

    if (profileError) {
      console.error('Error syncing QCS to profile:', profileError);
    }

    return new Response(JSON.stringify({
      user_id: userId,
      qcs_score: finalScore,
      scoring_details: scoringResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in qcs-scoring function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});