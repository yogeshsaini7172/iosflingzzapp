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

// Circuit breaker state management
let circuitBreakerActive = false;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
const CIRCUIT_BREAKER_RESET_TIME = 5 * 60 * 1000; // 5 minutes

// Reset circuit breaker after timeout
function resetCircuitBreaker() {
  setTimeout(() => {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log('Circuit breaker reset attempt - clearing failure count');
      consecutiveFailures = 0;
      circuitBreakerActive = false;
    }
  }, CIRCUIT_BREAKER_RESET_TIME);
}

// Enhanced OpenAI call with retry and fallback
async function callOpenAIWithFallback(
  requestBody: any,
  userId: string,
  operationType: 'refinement' | 'predictive'
): Promise<any> {
  // Circuit breaker check
  if (circuitBreakerActive) {
    console.log(`Circuit breaker active for ${operationType} - using fallback immediately`);
    return null;
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Handle rate limiting and other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 429) {
          consecutiveFailures++;
          console.log(`OpenAI quota exceeded (429) for user ${userId}, attempt ${attempt}, consecutive failures: ${consecutiveFailures}`);
          
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            circuitBreakerActive = true;
            console.log('Circuit breaker activated due to consecutive 429 errors');
            resetCircuitBreaker();
            return null;
          }
          
          if (attempt === 1) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 750));
            continue;
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('Invalid OpenAI response structure: no choices array');
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty content in OpenAI response');
      }

      // Reset failure count on successful call
      consecutiveFailures = 0;
      circuitBreakerActive = false;
      
      return { content, success: true };
    } catch (error) {
      console.log(`OpenAI ${operationType} attempt ${attempt} failed for user ${userId}:`, error.message);
      
      if (attempt === 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Final attempt failed
        consecutiveFailures++;
        console.log(`OpenAI ${operationType} final failure for user ${userId}, consecutive failures: ${consecutiveFailures}`);
        
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          circuitBreakerActive = true;
          console.log('Circuit breaker activated due to consecutive failures');
          resetCircuitBreaker();
        }
      }
    }
  }
  
  return null;
}

// AI refinement using OpenAI with fallback
async function aiRefinement(
  physical: string, 
  mental: string, 
  description: string, 
  rawScore: number, 
  behaviors: string[], 
  persona: string,
  userId: string
) {
  const requestBody = {
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
  };

  const result = await callOpenAIWithFallback(requestBody, userId, 'refinement');
  
  if (!result) {
    console.log(`AI refinement fallback for user ${userId}: using rule-based score`);
    return { 
      final_score: rawScore, 
      reason: 'Deterministic rule-based calculation (AI fallback)', 
      persona,
      ai_status: 'fallback'
    };
  }

  try {
    let { content } = result;
    
    // Try to extract JSON from response if it's wrapped in markdown or has extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    const parsed = JSON.parse(content);
    return { ...parsed, ai_status: 'success' };
  } catch (parseError) {
    console.log(`AI refinement JSON parse failed for user ${userId}, using fallback`);
    return { 
      final_score: rawScore, 
      reason: 'Deterministic rule-based calculation (JSON parse fallback)', 
      persona,
      ai_status: 'fallback'
    };
  }
}

// AI predictive scoring with fallback
async function aiPredictive(physical: string, mental: string, description: string, userId: string) {
  const requestBody = {
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
  };

  const result = await callOpenAIWithFallback(requestBody, userId, 'predictive');
  
  if (!result) {
    console.log(`AI predictive fallback for user ${userId}: using deterministic score`);
    // Generate deterministic fallback score based on input characteristics
    const fallbackScore = generateFallbackPredictiveScore(physical, mental, description);
    return { 
      predicted_score: fallbackScore, 
      insights: 'Deterministic analysis based on profile characteristics (AI fallback)', 
      red_flags: '',
      ai_status: 'fallback'
    };
  }

  try {
    let { content } = result;
    
    // Try to extract JSON from response if it's wrapped in markdown or has extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    const parsed = JSON.parse(content);
    
    // Normalize score
    if (parsed.predicted_score !== null && parsed.predicted_score >= 0 && parsed.predicted_score <= 10) {
      parsed.predicted_score = Math.floor(parsed.predicted_score * 10);
    }
    parsed.predicted_score = Math.max(0, Math.min(100, parsed.predicted_score || 0));
    
    return { ...parsed, ai_status: 'success' };
  } catch (parseError) {
    console.log(`AI predictive JSON parse failed for user ${userId}, using fallback`);
    const fallbackScore = generateFallbackPredictiveScore(physical, mental, description);
    return { 
      predicted_score: fallbackScore, 
      insights: 'Deterministic analysis based on profile characteristics (JSON parse fallback)', 
      red_flags: '',
      ai_status: 'fallback'
    };
  }
}

// Generate deterministic fallback score for predictive analysis
function generateFallbackPredictiveScore(physical: string, mental: string, description: string): number {
  let score = 55; // Base score
  
  // Analyze physical terms
  const physicalLower = physical.toLowerCase();
  if (physicalLower.includes('fit') || physicalLower.includes('athletic')) score += 15;
  else if (physicalLower.includes('average')) score += 5;
  else if (physicalLower.includes('tall')) score += 10;
  
  // Analyze mental terms  
  const mentalLower = mental.toLowerCase();
  if (mentalLower.includes('confident') || mentalLower.includes('ambitious')) score += 12;
  else if (mentalLower.includes('calm') || mentalLower.includes('logical')) score += 10;
  else if (mentalLower.includes('creative')) score += 8;
  
  // Analyze description quality
  if (description && description.length > 100) score += 8;
  else if (description && description.length > 50) score += 4;
  
  // Check for positive/negative indicators
  const descLower = description.toLowerCase();
  if (positiveWords.some(word => descLower.includes(word))) score += 6;
  if (negativeWords.some(word => descLower.includes(word))) score -= 10;
  
  return Math.max(20, Math.min(95, score));
}

// Main scoring pipeline with enhanced error handling
async function finalCustomerScoring(physical: string, mental: string, description: string, userId: string) {
  const ruleResult = ruleBasedScore(physical, mental, description);
  const persona = assignPersona(physical, mental);

  console.log(`Starting QCS calculation for user ${userId}: circuit_breaker=${circuitBreakerActive}, failures=${consecutiveFailures}`);

  const aiRuleResult = await aiRefinement(
    physical, mental, description, 
    ruleResult.score, ruleResult.behaviors, persona, userId
  );

  const aiPredictiveResult = await aiPredictive(physical, mental, description, userId);

  // Log AI status for monitoring
  const aiStatus = {
    refinement_status: aiRuleResult.ai_status || 'unknown',
    predictive_status: aiPredictiveResult.ai_status || 'unknown',
    circuit_breaker_active: circuitBreakerActive,
    consecutive_failures: consecutiveFailures
  };
  console.log(`QCS AI status for user ${userId}:`, aiStatus);

  return {
    rule_based: {
      ...aiRuleResult,
      base_score: ruleResult.score,
      behaviors: ruleResult.behaviors,
      persona_detected: persona
    },
    ai_based: aiPredictiveResult,
    ai_status: aiStatus,
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

    // Get AI-based scoring first with enhanced error handling
    const scoringResult = await finalCustomerScoring(physicalData, mentalData, descriptionData, userId);
    const aiScore = scoringResult.rule_based.final_score || scoringResult.rule_based.base_score || 50;

    // Calculate logic-based QCS from actual profile data
    const { data: fullProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`)
      .single();

    if (profileError) throw profileError;

    // Calculate profile score (0-40 points) - Enhanced scoring
    let profileScore = 0;
    
    // Bio quality (0-15 points)
    if (fullProfile.bio) {
      if (fullProfile.bio.length > 150) profileScore += 15;
      else if (fullProfile.bio.length > 50) profileScore += 10;
      else profileScore += 5;
    }
    
    // Images quality (0-15 points)
    if (fullProfile.profile_images && fullProfile.profile_images.length >= 4) profileScore += 15;
    else if (fullProfile.profile_images && fullProfile.profile_images.length >= 2) profileScore += 10;
    else if (fullProfile.profile_images && fullProfile.profile_images.length >= 1) profileScore += 5;
    
    // Interests diversity (0-10 points)
    if (fullProfile.interests && fullProfile.interests.length >= 5) profileScore += 10;
    else if (fullProfile.interests && fullProfile.interests.length >= 3) profileScore += 7;
    else if (fullProfile.interests && fullProfile.interests.length >= 1) profileScore += 3;

    // College tier score (0-30 points) - Enhanced with education level
    const collegeTierMap: Record<string, number> = {
      tier1: 30,
      tier2: 25,
      tier3: 20
    };
    let collegeTier = collegeTierMap[fullProfile.college_tier || 'tier3'] || 20;
    
    // Bonus for higher education
    if (fullProfile.education_level === 'phd_doctorate') collegeTier += 5;
    else if (fullProfile.education_level === 'postgraduate') collegeTier += 3;
    else if (fullProfile.education_level === 'undergraduate') collegeTier += 1;

    // Personality depth (0-20 points) - Enhanced personality scoring
    let personalityDepth = 0;
    
    // Parse qualities JSON
    let qualities: any = {};
    try {
      qualities = fullProfile.qualities ? JSON.parse(fullProfile.qualities as string) : {};
    } catch (e) {
      console.warn("Could not parse qualities JSON:", e);
      qualities = {};
    }
    
    // Personality traits depth
    if (qualities.personality_traits && qualities.personality_traits.length >= 3) personalityDepth += 8;
    else if (qualities.personality_traits && qualities.personality_traits.length >= 1) personalityDepth += 4;
    
    // Values depth  
    if (qualities.values && qualities.values.length >= 3) personalityDepth += 6;
    else if (qualities.values && qualities.values.length >= 1) personalityDepth += 3;
    
    // Mindset clarity
    if (qualities.mindset && qualities.mindset.length >= 1) personalityDepth += 3;
    
    // Relationship goals clarity
    if (qualities.relationship_goals && qualities.relationship_goals.length >= 1) personalityDepth += 3;

    // Behavior score (0-10 points, reduced by reports)
    const behaviorScore = Math.max(10 - (fullProfile.reports_count || 0) * 2, 0);

    // Calculate logic-based QCS
    const logicQcs = Math.min(100, profileScore + collegeTier + personalityDepth + behaviorScore);

    // Combine AI and Logic scores (60% logic, 40% AI for reliability)
    const totalQcs = Math.round(logicQcs * 0.6 + aiScore * 0.4);

    // Enhanced logging with AI status
    const aiStatusSummary = scoringResult.ai_status || {};
    console.log(`QCS calculated for ${userId}: Logic=${logicQcs}, AI=${aiScore}, Final=${totalQcs} (Profile: ${profileScore}, College: ${collegeTier}, Personality: ${personalityDepth}, Behavior: ${behaviorScore}) | AI Status: ${JSON.stringify(aiStatusSummary)}`);

    // Update QCS in database with detailed breakdown and AI status
    const { error: qcsError } = await supabase
      .from('qcs')
      .upsert({
        user_id: userId,
        profile_score: profileScore,
        college_tier: collegeTier,
        personality_depth: personalityDepth,
        behavior_score: behaviorScore,
        total_score: totalQcs
      }, { onConflict: 'user_id' });

    if (qcsError) {
      console.error(`QCS database update failed for user ${userId}:`, qcsError.message);
      // Don't throw here - continue with profile sync
    }

    // Sync total_qcs to profiles table with retry logic
    const { error: profileSyncError } = await supabase
      .from('profiles')
      .update({ total_qcs: totalQcs })
      .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`);

    if (profileSyncError) {
      console.error(`Profile QCS sync failed for user ${userId}:`, profileSyncError.message);
      // Don't throw here - still return successful result
    }

    // Success response with enhanced metadata
    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      qcs: {
        total_score: totalQcs,
        logic_score: logicQcs,
        ai_score: aiScore,
        profile_score: profileScore,
        college_tier: collegeTier,
        personality_depth: personalityDepth,
        behavior_score: behaviorScore
      },
      updated_qcs: totalQcs, // For compatibility with calculateQCS function
      final_score: totalQcs,
      scoring_details: scoringResult,
      ai_status: aiStatusSummary,
      circuit_breaker_active: circuitBreakerActive,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0-fallback'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Enhanced error logging with user context (no PII)
    const errorType = error.name || 'UnknownError';
    const errorMessage = error.message || 'Unknown error';
    
    console.error(`QCS function error for user ${userId}: ${errorType} - ${errorMessage}`);
    
    // For critical failures, attempt to provide fallback score
    try {
      // Try to provide a minimal fallback score if possible
      const fallbackQcs = 60; // Safe middle-ground score
      
      // Attempt to sync fallback score to profiles (non-blocking)
      supabase
        .from('profiles')
        .update({ total_qcs: fallbackQcs })
        .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`)
        .then(() => {
          console.log(`Fallback QCS ${fallbackQcs} synced for user ${userId}`);
        })
        .catch((syncError) => {
          console.error(`Fallback sync failed for user ${userId}:`, syncError.message);
        });
      
      return new Response(JSON.stringify({
        success: false,
        user_id: userId,
        qcs: {
          total_score: fallbackQcs,
          logic_score: fallbackQcs,
          ai_score: fallbackQcs,
          profile_score: 15,
          college_tier: 20,
          personality_depth: 15,
          behavior_score: 10
        },
        updated_qcs: fallbackQcs,
        final_score: fallbackQcs,
        error: 'QCS calculation failed, using fallback score',
        fallback_mode: true,
        ai_status: { 
          error_type: errorType,
          circuit_breaker_active: circuitBreakerActive,
          consecutive_failures: consecutiveFailures 
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '2.0-fallback-emergency'
        }
      }), {
        status: 200, // Return 200 to avoid breaking user flows
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fallbackError) {
      console.error(`Emergency fallback failed for user ${userId}:`, fallbackError.message);
      
      // Last resort - return minimal response
      return new Response(JSON.stringify({ 
        success: false,
        error: 'QCS service temporarily unavailable',
        fallback_score: 60,
        user_id: userId,
        emergency_mode: true
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});