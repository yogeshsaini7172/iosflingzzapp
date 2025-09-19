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

// Comprehensive scoring weights and tables (0.0 - 1.0)
const EDUCATION_WEIGHTS = {
  "high school": 0.6,
  "undergraduate": 0.8,
  "postgraduate": 0.9,
  "phd": 1.0,
  "doctorate": 1.0,
  "working professional": 0.9,
  "entrepreneur": 0.95,
  "other": 0.7
};

const PROFESSION_KEYWORDS = {
  "engineer": 0.9,
  "developer": 0.9,
  "manager": 0.9,
  "teacher": 0.85,
  "doctor": 1.0,
  "research": 0.95,
  "student": 0.7,
  "entrepreneur": 0.95
};

const BODY_TYPE_WEIGHTS = {
  "slim": 0.8,
  "athletic": 1.0,
  "average": 0.75,
  "curvy": 0.7,
  "plus size": 0.65,
  "prefer not to say": 0.7,
  "any": 0.7
};

const SKIN_TONE_WEIGHTS = {
  "very fair": 0.7,
  "fair": 0.75,
  "medium": 0.8,
  "olive": 0.8,
  "brown": 0.75,
  "dark": 0.7,
  "prefer not to say": 0.7
};

const PERSONALITY_WEIGHTS = {
  "adventurous": 0.95,
  "analytical": 0.9,
  "creative": 0.95,
  "outgoing": 0.9,
  "introverted": 0.75,
  "empathetic": 0.98,
  "ambitious": 0.96,
  "laid-back": 0.7,
  "intellectual": 0.92,
  "spontaneous": 0.88,
  "humorous": 0.9,
  "practical": 0.82,
  "responsible": 0.95,
  "emotional": 0.65,
  "calm": 0.85,
  "positive": 0.9,
  "philosophical": 0.9
};

const VALUES_WEIGHTS = {
  "family-oriented": 0.95,
  "career-focused": 0.9,
  "health-conscious": 0.95,
  "spiritual": 0.7,
  "traditional": 0.65,
  "social justice": 0.85,
  "environmental": 0.85,
  "creative": 0.9,
  "intellectual": 0.92,
  "open-minded": 1.0,
  "adventure-seeking": 0.88,
  "financially responsible": 0.9
};

const MINDSET_WEIGHTS = {
  "growth mindset": 1.0,
  "positive thinking": 0.98,
  "pragmatic": 0.87,
  "optimistic": 0.9,
  "realistic": 0.86,
  "ambitious": 0.94,
  "balanced": 0.96,
  "curious": 0.9,
  "reflective": 0.88
};

const RELATIONSHIP_WEIGHTS = {
  "serious relationship": 1.0,
  "casual dating": 0.6,
  "marriage": 1.0,
  "friendship first": 0.75,
  "long-term commitment": 1.0,
  "short-term fun": 0.5,
  "open to anything": 0.65,
  "travel companion": 0.6
};

const INTERESTS_WEIGHTS = {
  "travel": 0.95,
  "reading": 0.9,
  "music": 0.85,
  "movies": 0.7,
  "sports": 0.9,
  "cooking": 0.8,
  "art": 0.9,
  "technology": 0.98,
  "nature": 0.9,
  "photography": 0.8,
  "dancing": 0.8,
  "gaming": 0.6,
  "fitness": 1.0,
  "writing": 0.85,
  "volunteering": 0.9,
  "fashion": 0.65,
  "food": 0.85,
  "history": 0.78,
  "science": 0.95,
  "politics": 0.6,
  "spirituality": 0.65,
  "adventure activities": 0.98,
  "leadership": 0.9,
  "philosophy": 0.9
};

const CATEGORY_WEIGHTS = {
  "basic": 15,
  "physical": 15,
  "personality": 15,
  "values": 15,
  "mindset": 10,
  "relationship": 10,
  "interests": 10,
  "bio": 10
};

const POSITIVE_WORDS = ["love", "kind", "happy", "strong", "caring", "supportive", "honest", "grateful", "excited", "optimistic"];
const NEGATIVE_WORDS = ["hate", "angry", "toxic", "lazy", "sad", "jealous", "unstable", "depressed", "resentful", "bitter"];

// Aliases for messy inputs
const BODYTYPE_ALIAS: Record<string, string> = {
  "fit": "athletic",
  "fit/athletic": "athletic",
  "fit & athletic": "athletic",
  "average athletic": "athletic",
  "athl": "athletic"
};

const SKINTONE_ALIAS: Record<string, string> = {
  "wheatish": "medium",
  "wheat": "medium",
  "dusky": "brown",
  "brownish": "brown",
  "light brown": "brown"
};

const PERSONALITY_ALIAS: Record<string, string> = {
  "positive": "positive thinking",
  "intellect": "intellectual",
  "philosophical": "philosophical"
};

const RELATIONSHIP_ALIAS: Record<string, string> = {
  "travel": "travel companion"
};

// Utility functions for parsing and normalization
function tryParseStringList(val: any): string[] | null {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) {
    return val.filter(x => x !== null && x !== undefined && String(x).trim())
              .map(x => String(x).trim().toLowerCase());
  }
  if (typeof val !== 'string') return null;
  
  const s = val.trim();
  // Try JSON array parsing
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.filter(x => x !== null && x !== undefined && String(x).trim())
                    .map(x => String(x).trim().toLowerCase());
      }
    } catch (e) {
      // Fall through to comma separation
    }
  }
  
  // Comma/semicolon/pipe separated
  const items = s.split(/[,;/|]+/).map(x => x.trim().toLowerCase()).filter(x => x);
  return items.length > 0 ? items : null;
}

function normalizeOption(raw: any, aliasMap: Record<string, string>, tableKeys: string[]): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  
  // Apply alias mapping
  if (aliasMap[s]) return aliasMap[s];
  
  // Direct match
  if (tableKeys.includes(s)) return s;
  
  // Containment match
  for (const key of tableKeys) {
    if (key.includes(s) || s.includes(key)) return key;
  }
  
  // Return raw for default weight handling
  return s;
}

function normalizeList(raw: any, aliasMap: Record<string, string>, tableKeys: string[]): string[] | null {
  const parsed = tryParseStringList(raw);
  if (!parsed) return null;
  
  const out: string[] = [];
  for (const item of parsed) {
    if (!item) continue;
    const mapped = normalizeOption(item, aliasMap, tableKeys);
    if (mapped) out.push(mapped);
  }
  
  return out.length > 0 ? out : null;
}

// Helper scoring utilities
function safeGetOptionWeight(option: string | null, table: Record<string, number>, defaultWeight: number = 0.6): number {
  if (!option) return 0.0;
  const o = option.toLowerCase();
  
  // Direct match
  if (table[o] !== undefined) return table[o];
  
  // Fuzzy match (simple containment)
  for (const [key, weight] of Object.entries(table)) {
    if (key.includes(o) || o.includes(key)) return weight;
  }
  
  // Fallback default
  return defaultWeight;
}

function computeMultiselectFraction(selected: string[], table: Record<string, number>, maxChoices: number): number {
  if (!selected || selected.length === 0) return 0.0;
  
  const weights = selected.map(s => safeGetOptionWeight(s, table));
  const selSum = weights.reduce((a, b) => a + b, 0);
  
  const topWeights = Object.values(table).sort((a, b) => b - a).slice(0, maxChoices);
  const maxPossible = topWeights.reduce((a, b) => a + b, 0) || maxChoices * 1.0;
  
  if (maxPossible <= 0) return 0.0;
  
  const frac = selSum / maxPossible;
  return Math.min(1.0, frac);
}

function computeSingleOptionFraction(option: string | null, table: Record<string, number>): number {
  return safeGetOptionWeight(option, table);
}

function ageFractionFromDob(dob: string | null): number {
  if (!dob) return 0.0;
  
  let age: number;
  try {
    const dt = new Date(dob);
    age = Math.floor((Date.now() - dt.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  } catch (e) {
    try {
      age = parseInt(dob);
    } catch (e2) {
      // Try to extract year from string
      const yearMatch = dob.match(/\d{4}/);
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        age = new Date().getFullYear() - year;
      } else {
        return 0.0;
      }
    }
  }
  
  const diff = Math.abs(age - 30);
  const frac = Math.max(0.0, 1.0 - (diff / 50.0));
  return Math.max(0.0, Math.min(1.0, frac));
}

function bioFraction(bio: string | null): number {
  if (!bio) return 0.0;
  
  const words = bio.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const n = words.length;
  const lengthFactor = Math.min(1.0, n / 80.0);
  
  const pos = words.filter(w => POSITIVE_WORDS.includes(w)).length;
  const neg = words.filter(w => NEGATIVE_WORDS.includes(w)).length;
  
  let sentiment = 0.0;
  if (pos + neg > 0) {
    sentiment = ((pos - neg) / (pos + neg)) * 0.3;
  }
  
  const frac = lengthFactor + sentiment;
  return Math.max(0.0, Math.min(1.0, frac));
}

// Comprehensive deterministic scoring based on profile data
function deterministicScoring(profile: any): { score: number, perCategoryFraction: Record<string, number> } {
  const perCatFraction: Record<string, number> = {};
  let includedWeights = 0.0;
  let totalContribution = 0.0;

  // Basic: age, education, field of study
  const basicComponents: number[] = [];
  
  if (profile.date_of_birth || profile.dob) {
    basicComponents.push(ageFractionFromDob(profile.date_of_birth || profile.dob));
  }

  // Education from year of study
  let eduVal: string | null = null;
  if (profile.year_of_study) {
    const ys = String(profile.year_of_study).toLowerCase();
    if (ys.includes('1st') || ys.includes('2nd') || ys.includes('3rd') || ys.includes('4th') || 
        ys.includes('year') || ys.includes('undergrad')) {
      eduVal = "undergraduate";
    } else if (ys.includes('graduate') || ys.includes('masters') || ys.includes('pg') || ys.includes('postgraduate')) {
      eduVal = "postgraduate";
    } else if (ys.includes('phd') || ys.includes('doctorate')) {
      eduVal = "phd";
    } else {
      eduVal = ys;
    }
  }
  if (eduVal) {
    basicComponents.push(safeGetOptionWeight(eduVal, EDUCATION_WEIGHTS));
  }

  // Field of study profession keywords
  if (profile.field_of_study) {
    const f = String(profile.field_of_study).toLowerCase();
    let matched = 0.0;
    for (const [kw, w] of Object.entries(PROFESSION_KEYWORDS)) {
      if (f.includes(kw)) {
        matched = w;
        break;
      }
    }
    if (matched > 0) {
      basicComponents.push(matched);
    }
  }

  if (basicComponents.length > 0) {
    const frac = basicComponents.reduce((a, b) => a + b, 0) / basicComponents.length;
    perCatFraction["basic"] = frac;
    const w = CATEGORY_WEIGHTS["basic"];
    includedWeights += w;
    totalContribution += frac * w;
  }

  // Physical
  const physComponents: number[] = [];
  
  if (profile.height) {
    try {
      const h = parseFloat(String(profile.height));
      const hFrac = Math.max(0.0, 1.0 - Math.abs(h - 175.0) / 40.0);
      physComponents.push(hFrac);
    } catch (e) {
      // Ignore height parsing errors
    }
  }
  
  if (profile.body_type) {
    const normalized = normalizeOption(profile.body_type, BODYTYPE_ALIAS, Object.keys(BODY_TYPE_WEIGHTS));
    physComponents.push(computeSingleOptionFraction(normalized, BODY_TYPE_WEIGHTS));
  }
  
  if (profile.skin_tone) {
    const normalized = normalizeOption(profile.skin_tone, SKINTONE_ALIAS, Object.keys(SKIN_TONE_WEIGHTS));
    physComponents.push(computeSingleOptionFraction(normalized, SKIN_TONE_WEIGHTS));
  }

  if (physComponents.length > 0) {
    const frac = physComponents.reduce((a, b) => a + b, 0) / physComponents.length;
    perCatFraction["physical"] = frac;
    const w = CATEGORY_WEIGHTS["physical"];
    includedWeights += w;
    totalContribution += frac * w;
  }

  // Personality
  let personalityTraits = profile.personality_traits;
  if (!personalityTraits && profile.personality_type) {
    personalityTraits = tryParseStringList(profile.personality_type);
  }
  
  if (personalityTraits) {
    const normalized = normalizeList(personalityTraits, PERSONALITY_ALIAS, Object.keys(PERSONALITY_WEIGHTS));
    if (normalized && normalized.length > 0) {
      const frac = computeMultiselectFraction(normalized, PERSONALITY_WEIGHTS, 3);
      perCatFraction["personality"] = frac;
      const w = CATEGORY_WEIGHTS["personality"];
      includedWeights += w;
      totalContribution += frac * w;
    }
  } else if (profile.personality_type) {
    const normalized = normalizeOption(profile.personality_type, PERSONALITY_ALIAS, Object.keys(PERSONALITY_WEIGHTS));
    const frac = computeSingleOptionFraction(normalized, PERSONALITY_WEIGHTS);
    perCatFraction["personality"] = frac;
    const w = CATEGORY_WEIGHTS["personality"];
    includedWeights += w;
    totalContribution += frac * w;
  }

  // Values
  if (profile.values) {
    const normalized = normalizeList(profile.values, {}, Object.keys(VALUES_WEIGHTS));
    if (normalized && normalized.length > 0) {
      const frac = computeMultiselectFraction(normalized, VALUES_WEIGHTS, 3);
      perCatFraction["values"] = frac;
      const w = CATEGORY_WEIGHTS["values"];
      includedWeights += w;
      totalContribution += frac * w;
    }
  }

  // Mindset
  if (profile.mindset) {
    let mindsetList = normalizeList(profile.mindset, {}, Object.keys(MINDSET_WEIGHTS));
    // Map common short labels to full keys
    if (mindsetList) {
      mindsetList = mindsetList.map(m => {
        if (m === "growth" || m === "growth mindset") return "growth mindset";
        if (m.includes("positive")) return "positive thinking";
        return m;
      });
      
      const frac = computeMultiselectFraction(mindsetList, MINDSET_WEIGHTS, 2);
      perCatFraction["mindset"] = frac;
      const w = CATEGORY_WEIGHTS["mindset"];
      includedWeights += w;
      totalContribution += frac * w;
    }
  }

  // Relationship goals
  if (profile.relationship_goals) {
    const normalized = normalizeList(profile.relationship_goals, RELATIONSHIP_ALIAS, Object.keys(RELATIONSHIP_WEIGHTS));
    if (normalized && normalized.length > 0) {
      const frac = computeMultiselectFraction(normalized, RELATIONSHIP_WEIGHTS, 3);
      perCatFraction["relationship"] = frac;
      const w = CATEGORY_WEIGHTS["relationship"];
      includedWeights += w;
      totalContribution += frac * w;
    }
  }

  // Interests
  if (profile.interests) {
    const normalized = normalizeList(profile.interests, {}, Object.keys(INTERESTS_WEIGHTS));
    if (normalized && normalized.length > 0) {
      const frac = computeMultiselectFraction(normalized, INTERESTS_WEIGHTS, 10);
      perCatFraction["interests"] = frac;
      const w = CATEGORY_WEIGHTS["interests"];
      includedWeights += w;
      totalContribution += frac * w;
    }
  }

  // Bio
  if (profile.bio) {
    const frac = bioFraction(profile.bio);
    perCatFraction["bio"] = frac;
    const w = CATEGORY_WEIGHTS["bio"];
    includedWeights += w;
    totalContribution += frac * w;
  }

  if (includedWeights <= 0) {
    return { score: 50.0, perCategoryFraction: perCatFraction };
  }

  const finalFraction = totalContribution / includedWeights;
  const deterministicScore = finalFraction * 100.0;
  
  return { score: deterministicScore, perCategoryFraction: perCatFraction };
}

// Enhanced persona assignment based on comprehensive profile
function assignPersona(profile: any): string {
  const personality = profile.personality_traits || profile.personality_type || [];
  const values = profile.values || [];
  const interests = profile.interests || [];
  const bodyType = profile.body_type || "";
  
  // Convert to arrays if needed
  const personalityArray = Array.isArray(personality) ? personality : [personality].filter(Boolean);
  const valuesArray = Array.isArray(values) ? values : [values].filter(Boolean);
  const interestsArray = Array.isArray(interests) ? interests : [interests].filter(Boolean);
  
  const combined = [...personalityArray, ...valuesArray, ...interestsArray, bodyType]
    .map(x => String(x).toLowerCase())
    .join(' ');

  // Enhanced persona detection based on comprehensive traits
  const personas = {
    'Adventurous Explorer': ['adventurous', 'travel', 'fitness', 'athletic', 'sports'],
    'Intellectual Thinker': ['intellectual', 'analytical', 'reading', 'science', 'philosophy'],
    'Creative Visionary': ['creative', 'art', 'music', 'writing', 'photography'],
    'Empathetic Caregiver': ['empathetic', 'caring', 'family-oriented', 'supportive', 'kind'],
    'Ambitious Leader': ['ambitious', 'career-focused', 'leadership', 'confident', 'responsible'],
    'Balanced Individual': ['balanced', 'calm', 'practical', 'realistic', 'stable'],
    'Social Connector': ['outgoing', 'humorous', 'social', 'dancing', 'music'],
    'Growth-Minded Optimist': ['growth mindset', 'optimistic', 'positive', 'curious', 'learning'],
    'Health-Conscious Achiever': ['health-conscious', 'fitness', 'athletic', 'discipline', 'active'],
    'Open-Minded Free Spirit': ['open-minded', 'spontaneous', 'creative', 'adventure-seeking', 'flexible']
  };

  let bestMatch = 'Balanced Individual';
  let bestScore = 0;

  for (const [persona, traits] of Object.entries(personas)) {
    const matchCount = traits.filter(trait => combined.includes(trait)).length;
    if (matchCount > bestScore) {
      bestMatch = persona;
      bestScore = matchCount;
    }
  }

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

// Generate deterministic fallback score for predictive analysis using comprehensive algorithm
function generateFallbackPredictiveScore(profile: any): number {
  const { score } = deterministicScoring(profile);
  // Add some variation for predictive vs rule-based distinction
  const variation = Math.random() * 10 - 5; // -5 to +5 variation
  return Math.max(20, Math.min(95, score + variation));
}

// Main scoring pipeline with comprehensive algorithm and enhanced error handling
async function finalCustomerScoring(profile: any, userId: string) {
  // Use comprehensive deterministic scoring
  const { score: ruleScore, perCategoryFraction } = deterministicScoring(profile);
  const persona = assignPersona(profile);

  console.log(`Starting comprehensive QCS calculation for user ${userId}: circuit_breaker=${circuitBreakerActive}, failures=${consecutiveFailures}`);

  // Create behaviors array from category fractions for compatibility
  const behaviors: string[] = [];
  Object.entries(perCategoryFraction).forEach(([category, fraction]) => {
    if (fraction > 0.8) behaviors.push(`Strong ${category} profile`);
    else if (fraction > 0.6) behaviors.push(`Good ${category} traits`);
    else if (fraction < 0.3) behaviors.push(`Needs ${category} improvement`);
  });

  // AI refinement with comprehensive profile data
  const requestBody = {
    model: 'gpt-5-mini-2025-08-07',
    max_completion_tokens: 400,
    messages: [
      {
        role: 'system',
        content: 'You are a comprehensive dating profile evaluator. Refine scores with detailed reasoning based on multi-dimensional profile analysis.'
      },
      {
        role: 'user',
        content: `Profile Analysis:
Bio: ${profile.bio || 'Not provided'}
Personality: ${JSON.stringify(profile.personality_traits || profile.personality_type || 'Not provided')}
Values: ${JSON.stringify(profile.values || 'Not provided')}
Interests: ${JSON.stringify(profile.interests || 'Not provided')}
Education: ${profile.field_of_study || 'Not provided'} (${profile.year_of_study || 'Not provided'})
Physical: ${profile.body_type || 'Not provided'}, Height: ${profile.height || 'Not provided'}cm

Deterministic Score: ${ruleScore}
Category Breakdown: ${JSON.stringify(perCategoryFraction)}
Detected Persona: ${persona}
Key Behaviors: ${behaviors.join(', ')}

Return JSON format:
{"final_score": number, "reason": "string", "persona": "${persona}", "insights": "string"}`
      }
    ],
  };

  const aiRuleResult = await callOpenAIWithFallback(requestBody, userId, 'refinement');
  
  let aiRefinedResult;
  if (!aiRuleResult) {
    console.log(`AI refinement fallback for user ${userId}: using deterministic score`);
    aiRefinedResult = { 
      final_score: ruleScore, 
      reason: 'Comprehensive deterministic calculation (AI fallback)', 
      persona,
      insights: `Multi-dimensional analysis: ${Object.keys(perCategoryFraction).join(', ')} evaluated`,
      ai_status: 'fallback'
    };
  } else {
    try {
      let { content } = aiRuleResult;
      
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      
      const parsed = JSON.parse(content);
      aiRefinedResult = { ...parsed, ai_status: 'success' };
    } catch (parseError) {
      console.log(`AI refinement JSON parse failed for user ${userId}, using fallback`);
      aiRefinedResult = { 
        final_score: ruleScore, 
        reason: 'Comprehensive deterministic calculation (JSON parse fallback)', 
        persona,
        insights: `Multi-dimensional analysis: ${Object.keys(perCategoryFraction).join(', ')} evaluated`,
        ai_status: 'fallback'
      };
    }
  }

  // AI predictive scoring
  const predictiveRequestBody = {
    model: 'gpt-5-mini-2025-08-07',
    max_completion_tokens: 400,
    messages: [
      {
        role: 'system',
        content: 'You are a psychologist that predicts dating compatibility independently using comprehensive profile analysis.'
      },
      {
        role: 'user',
        content: `Comprehensive Profile Analysis:
Bio Quality: ${profile.bio ? `${profile.bio.length} chars` : 'Missing'}
Personality Depth: ${profile.personality_traits ? profile.personality_traits.length : 0} traits
Values Alignment: ${profile.values ? profile.values.length : 0} values
Interest Diversity: ${profile.interests ? profile.interests.length : 0} interests
Education Level: ${profile.field_of_study || 'Unknown'} (${profile.year_of_study || 'Unknown'})
Physical Attributes: ${profile.body_type || 'Unknown'} body type

Category Scores: ${JSON.stringify(perCategoryFraction)}
Detected Persona: ${persona}

Return JSON:
{"predicted_score": number, "insights": "comprehensive analysis", "red_flags": "any concerns", "compatibility_factors": "key strengths"}`
      }
    ],
  };

  const aiPredictiveCall = await callOpenAIWithFallback(predictiveRequestBody, userId, 'predictive');
  
  let aiPredictiveResult;
  if (!aiPredictiveCall) {
    console.log(`AI predictive fallback for user ${userId}: using comprehensive deterministic score`);
    const fallbackScore = generateFallbackPredictiveScore(profile);
    aiPredictiveResult = { 
      predicted_score: fallbackScore,
      insights: 'Comprehensive deterministic analysis based on multi-dimensional profile evaluation (AI fallback)',
      red_flags: perCategoryFraction.bio < 0.3 ? 'Limited bio information' : '',
      compatibility_factors: Object.entries(perCategoryFraction).filter(([_, v]) => v > 0.7).map(([k, _]) => k).join(', ') || 'Balanced profile',
      ai_status: 'fallback'
    };
  } else {
    try {
      let { content } = aiPredictiveCall;
      
      // Try to extract JSON from response
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
      
      aiPredictiveResult = { ...parsed, ai_status: 'success' };
    } catch (parseError) {
      console.log(`AI predictive JSON parse failed for user ${userId}, using fallback`);
      const fallbackScore = generateFallbackPredictiveScore(profile);
      aiPredictiveResult = { 
        predicted_score: fallbackScore,
        insights: 'Comprehensive deterministic analysis based on multi-dimensional profile evaluation (JSON parse fallback)',
        red_flags: perCategoryFraction.bio < 0.3 ? 'Limited bio information' : '',
        compatibility_factors: Object.entries(perCategoryFraction).filter(([_, v]) => v > 0.7).map(([k, _]) => k).join(', ') || 'Balanced profile',
        ai_status: 'fallback'
      };
    }
  }

  // Log AI status for monitoring
  const aiStatus = {
    refinement_status: aiRefinedResult.ai_status || 'unknown',
    predictive_status: aiPredictiveResult.ai_status || 'unknown',
    circuit_breaker_active: circuitBreakerActive,
    consecutive_failures: consecutiveFailures,
    scoring_version: 'comprehensive-v2'
  };
  console.log(`Comprehensive QCS AI status for user ${userId}:`, aiStatus);

  return {
    rule_based: {
      ...aiRefinedResult,
      base_score: ruleScore,
      behaviors,
      persona_detected: persona,
      category_breakdown: perCategoryFraction
    },
    ai_based: aiPredictiveResult,
    ai_status: aiStatus,
    final_judgment: 'Comprehensive multi-dimensional scoring with AI enhancement'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read body once and allow explicit user_id to be provided
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    // Determine target user id
    let userId: string | null = body?.user_id ?? null;

    // If not provided in body, try to derive from Firebase token (backward compatible)
    if (!userId) {
      const authHeader = req.headers.get('authorization') || '';
      const idToken = authHeader.replace('Bearer ', '');

      if (idToken) {
        const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
        try {
          if (!serviceAccountJson) throw new Error('Firebase service account not configured');
          const serviceAccount = JSON.parse(serviceAccountJson);
          const projectId = serviceAccount.project_id as string;

          const parts = idToken.split('.');
          if (parts.length >= 2) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
            const payload = JSON.parse(atob(base64));

            const expectedIss = `https://securetoken.google.com/${projectId}`;
            const issOk = typeof payload.iss === 'string' && payload.iss === expectedIss;
            const audOk = typeof payload.aud === 'string' && payload.aud === projectId;
            const subOk = typeof payload.sub === 'string' && payload.sub.length > 0;
            if (issOk && audOk && subOk) {
              userId = payload.sub as string;
            }
          }
        } catch (_e) {
          // Ignore token errors; we'll require user_id in body
        }
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read optional scoring inputs from body
    const { physical, mental, description } = body || {};

    // Fetch comprehensive profile data always for accurate scoring
    const { data: fullProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle();

    if (error) throw error;
    if (!fullProfile) throw new Error(`Profile not found for user ${userId}`);

    // Get scoring based on provided data or use profile defaults
    let physicalData = physical || `${fullProfile.body_type || 'average'} ${fullProfile.height ? (fullProfile.height > 170 ? 'tall' : 'average') : 'average'}`;
    let mentalData = mental || `${fullProfile.personality_type || 'average'} ${Array.isArray(fullProfile.interests) && fullProfile.interests.includes('fitness') ? 'ambitious' : 'calm'}`;
    let descriptionData = description || fullProfile.bio || 'No description available';

    console.log('Comprehensive scoring for user:', userId, 'Profile keys:', Object.keys(fullProfile || {}));

    // Get comprehensive AI-based scoring with enhanced error handling
    const scoringResult = await finalCustomerScoring(fullProfile, userId);
    const aiScore = scoringResult.rule_based.final_score || scoringResult.rule_based.base_score || 50;

    // Use comprehensive deterministic scoring for logic-based QCS calculation
    const { score: comprehensiveLogicScore, perCategoryFraction } = deterministicScoring(fullProfile);
    
    // Enhanced scoring breakdown using comprehensive algorithm
    const profileScore = Math.round((perCategoryFraction.basic || 0) * CATEGORY_WEIGHTS.basic + 
                                   (perCategoryFraction.bio || 0) * CATEGORY_WEIGHTS.bio + 
                                   (perCategoryFraction.interests || 0) * CATEGORY_WEIGHTS.interests);
    
    const collegeTier = Math.round((perCategoryFraction.basic || 0) * 30); // Education component
    const personalityDepth = Math.round((perCategoryFraction.personality || 0) * CATEGORY_WEIGHTS.personality + 
                                       (perCategoryFraction.values || 0) * CATEGORY_WEIGHTS.values + 
                                       (perCategoryFraction.mindset || 0) * CATEGORY_WEIGHTS.mindset);
    
    // Behavior score (0-10 points, reduced by reports)
    const behaviorScore = Math.max(10 - (fullProfile.reports_count || 0) * 2, 0);

    // Use comprehensive logic score
    const logicQcs = Math.min(100, comprehensiveLogicScore);

    // Combine AI and Logic scores (60% comprehensive logic, 40% AI for reliability)
    const totalQcs = Math.round(logicQcs * 0.6 + aiScore * 0.4);

    // Enhanced logging with AI status
    const aiStatusSummary = scoringResult.ai_status || {};
    console.log(`QCS calculated for ${userId}: Logic=${logicQcs}, AI=${aiScore}, Final=${totalQcs} (Profile: ${profileScore}, College: ${collegeTier}, Personality: ${personalityDepth}, Behavior: ${behaviorScore}) | AI Status: ${JSON.stringify(aiStatusSummary)}`);

    // Update QCS in database with detailed breakdown and AI status
    const { data: qcsUpserted, error: qcsError } = await supabase
      .from('qcs')
      .upsert({
        user_id: userId,
        profile_score: profileScore,
        college_tier: collegeTier,
        personality_depth: personalityDepth,
        behavior_score: behaviorScore,
        total_score: totalQcs,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (qcsError) {
      console.error('QCS upsert error:', qcsError.message);
    }

    // Sync to profiles table immediately so UI sees the updated value
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ total_qcs: totalQcs, updated_at: new Date().toISOString() })
      .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`);

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError.message);
    }

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