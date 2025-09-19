import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inlined blend utilities with AI weight parameter
function blendScore(logicScore: number, aiScore: number | null, aiWeight: number = 0.5): number {
  // Blend based on AI weight (default 50/50)
  if (typeof aiScore === 'number' && aiScore > 0 && !isNaN(aiScore)) {
    const w = Math.max(0, Math.min(1, aiWeight));
    return Math.round((1 - w) * logicScore + w * aiScore);
  }
  // Fallback to pure logic score
  return Math.round(logicScore);
}

function validateScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score || 0)));
}

// Inlined OpenAI client code
const DEFAULT_MODELS = ['gpt-4o-mini', 'gpt-4.1-mini-2025-04-14', 'gpt-5-mini-2025-08-07', 'gpt-4o'];
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface OpenAIRequest {
  apiKey: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
  parseJson?: boolean;
}

interface OpenAIResponse {
  model: string;
  rawResponse: any;
  parsedContent: any;
}

async function sendOpenAIRequest({
  apiKey,
  model,
  messages,
  maxTokens = 800,
  temperature = 0.0,
  parseJson = true
}: OpenAIRequest): Promise<OpenAIResponse> {
  if (!apiKey) throw new Error('Missing OpenAI API key');

  const modelsToTry = model ? [model, ...DEFAULT_MODELS.filter(m => m !== model)] : DEFAULT_MODELS;
  let lastError: any = null;

  for (const tryModel of modelsToTry) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const requestBody: any = {
          model: tryModel,
          messages,
        };

        if (tryModel.includes('gpt-5') || tryModel.includes('gpt-4.1') || tryModel.includes('o3') || tryModel.includes('o4')) {
          requestBody.max_completion_tokens = maxTokens;
        } else {
          requestBody.max_tokens = maxTokens;
          requestBody.temperature = temperature;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        const raw = await response.text();
        console.log(`OpenAI ${tryModel} attempt ${attempt + 1}: status=${response.status}, rawLength=${raw.length}`);
        
        let parsed: any;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch (e) {
          console.log(`OpenAI JSON parse failed for ${tryModel}:`, raw.substring(0, 200));
          parsed = null;
        }

        if (!response.ok) {
          lastError = { status: response.status, ok: response.ok, raw, parsed, model: tryModel };
          
          if (response.status >= 500 || response.status === 429) {
            const wait = BASE_BACKOFF_MS * (2 ** attempt);
            console.log(`OpenAI ${tryModel} transient error ${response.status}, retrying in ${wait}ms`);
            await sleep(wait);
            continue;
          } else {
            console.log(`OpenAI ${tryModel} client error ${response.status}, trying next model`);
            break;
          }
        }

        const choice = parsed?.choices?.[0];
        const content = choice?.message?.content ?? null;

        if (!content || content.trim().length === 0) {
          lastError = { reason: 'empty_content', model: tryModel, raw, parsed };
          console.log(`OpenAI ${tryModel} returned empty content, attempt ${attempt + 1}`);
          await sleep(BASE_BACKOFF_MS * (1 + attempt));
          continue;
        }

        console.log(`OpenAI ${tryModel} success: content length=${content.length}`);

        if (parseJson) {
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonContent = jsonMatch ? jsonMatch[0] : content;
            const json = JSON.parse(jsonContent);
            return { model: tryModel, rawResponse: parsed, parsedContent: json };
          } catch (e) {
            const maybeNumber = content.match(/-?\d+(\.\d+)?/);
            if (maybeNumber) {
              return { 
                model: tryModel, 
                rawResponse: parsed, 
                parsedContent: { score: Number(maybeNumber[0]), raw: content } 
              };
            }
            lastError = { reason: 'invalid_content_format', model: tryModel, raw, parsed, parseError: e.message };
            console.log(`OpenAI ${tryModel} JSON parse failed:`, e.message);
            await sleep(BASE_BACKOFF_MS * (1 + attempt));
            continue;
          }
        }

        return { model: tryModel, rawResponse: parsed, parsedContent: content };
        
      } catch (err) {
        lastError = { attempt, model: tryModel, error: err?.message ?? String(err) };
        console.log(`OpenAI ${tryModel} network error attempt ${attempt + 1}:`, err?.message);
        
        const wait = BASE_BACKOFF_MS * (2 ** attempt);
        await sleep(wait);
        continue;
      }
    }
    console.log(`OpenAI ${tryModel} failed all attempts, trying next model`);
  }

  const error = new Error('All OpenAI attempts failed');
  (error as any).details = lastError;
  throw error;
}

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

// Big-5 Personality Model (Local Psychology Assessment)
const PERSONALITY_TO_BIG5: Record<string, Record<string, number>> = {
  "adventurous": { "openness": 0.8, "extraversion": 0.6 },
  "analytical": { "openness": 0.6, "conscientiousness": 0.7 },
  "creative": { "openness": 0.9, "extraversion": 0.3 },
  "outgoing": { "extraversion": 0.9 },
  "introverted": { "extraversion": 0.2 },
  "empathetic": { "agreeableness": 0.9 },
  "ambitious": { "conscientiousness": 0.9 },
  "laid-back": { "neuroticism": -0.5 },
  "intellectual": { "openness": 0.8, "conscientiousness": 0.5 },
  "spontaneous": { "openness": 0.7, "extraversion": 0.5 },
  "humorous": { "extraversion": 0.5, "agreeableness": 0.4 },
  "practical": { "conscientiousness": 0.7 },
  "responsible": { "conscientiousness": 0.95 },
  "emotional": { "neuroticism": 0.6 },
  "calm": { "neuroticism": -0.5 },
  "positive thinking": { "neuroticism": -0.6, "agreeableness": 0.4 },
  "philosophical": { "openness": 0.85 }
};

function computeBig5FromProfile(profile: any): { big5: Record<string, number>, metadata: any } {
  const dims = { "openness": 0.0, "conscientiousness": 0.0, "extraversion": 0.0, "agreeableness": 0.0, "neuroticism": 0.0 };
  const weights = { "openness": 0.0, "conscientiousness": 0.0, "extraversion": 0.0, "agreeableness": 0.0, "neuroticism": 0.0 };

  // Process personality traits
  const personalityTraits = tryParseStringList(profile.personality_traits || profile.personality_type) || [];
  for (const trait of personalityTraits) {
    const traitWeight = safeGetOptionWeight(trait, PERSONALITY_WEIGHTS, 0.6);
    const mapping = PERSONALITY_TO_BIG5[trait];
    if (mapping) {
      Object.entries(mapping).forEach(([dim, contrib]) => {
        dims[dim] += traitWeight * contrib;
        weights[dim] += traitWeight;
      });
    }
  }

  // Process values
  const values = tryParseStringList(profile.values) || [];
  values.forEach(v => {
    const vWeight = safeGetOptionWeight(v, VALUES_WEIGHTS, 0.6);
    if (v.includes("open") || v.includes("creative") || v.includes("intellect") || v.includes("adventure")) {
      dims["openness"] += 0.6 * vWeight;
      weights["openness"] += vWeight;
    }
    if (v.includes("family") || v.includes("financial") || v.includes("responsible")) {
      dims["agreeableness"] += 0.5 * vWeight;
      weights["agreeableness"] += vWeight;
    }
  });

  // Process mindset
  const mindset = tryParseStringList(profile.mindset) || [];
  mindset.forEach(m => {
    const mWeight = safeGetOptionWeight(m, MINDSET_WEIGHTS, 0.6);
    if (m.includes("growth") || m.includes("curious")) {
      dims["openness"] += 0.7 * mWeight;
      weights["openness"] += mWeight;
    }
    if (m.includes("positive")) {
      dims["neuroticism"] -= 0.6 * mWeight;
      weights["neuroticism"] += mWeight;
    }
  });

  // Process interests
  const interests = tryParseStringList(profile.interests) || [];
  interests.forEach(interest => {
    const iWeight = safeGetOptionWeight(interest, INTERESTS_WEIGHTS, 0.6);
    if (["reading", "art", "philosophy", "science"].includes(interest)) {
      dims["openness"] += 0.6 * iWeight;
      weights["openness"] += iWeight;
    }
    if (["fitness", "sports"].includes(interest)) {
      dims["extraversion"] += 0.5 * iWeight;
      weights["extraversion"] += iWeight;
    }
    if (["volunteering", "family"].includes(interest)) {
      dims["agreeableness"] += 0.6 * iWeight;
      weights["agreeableness"] += iWeight;
    }
  });

  // Process bio sentiment
  let bioSentiment = 0.0;
  if (profile.bio) {
    const words = profile.bio.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const pos = words.filter(w => POSITIVE_WORDS.includes(w)).length;
    const neg = words.filter(w => NEGATIVE_WORDS.includes(w)).length;
    
    if (pos + neg > 0) {
      bioSentiment = (pos - neg) / (pos + neg);
      dims["neuroticism"] -= 0.5 * bioSentiment;
      weights["neuroticism"] += 0.6;
      dims["agreeableness"] += 0.2 * bioSentiment;
      weights["agreeableness"] += 0.3;
    }
  }

  // Normalize dimensions to 0-1 scale
  const big5: Record<string, number> = {};
  Object.keys(dims).forEach(k => {
    if (weights[k] > 0) {
      const raw = dims[k] / weights[k];
      const clamped = Math.max(-1.0, Math.min(1.0, raw));
      big5[k] = Math.max(0.0, Math.min(1.0, (clamped + 1.0) / 2.0));
    } else {
      big5[k] = 0.0;
    }
  });

  return { 
    big5, 
    metadata: { 
      dims_raw: dims, 
      weights, 
      bio_sentiment: bioSentiment,
      traits_processed: personalityTraits.length,
      values_processed: values.length,
      interests_processed: interests.length
    } 
  };
}

function psychModelAssessor(profile: any): { score: number, reason: string, breakdown: any } {
  const { big5, metadata } = computeBig5FromProfile(profile);
  
  const weights = {
    "openness": 0.22,
    "conscientiousness": 0.26,
    "extraversion": 0.18,
    "agreeableness": 0.20,
    "neuroticism": 0.14
  };
  
  const score = (
    weights["openness"] * big5["openness"] +
    weights["conscientiousness"] * big5["conscientiousness"] +
    weights["extraversion"] * big5["extraversion"] +
    weights["agreeableness"] * big5["agreeableness"] +
    weights["neuroticism"] * (1.0 - big5["neuroticism"])
  );
  
  const score100 = Math.max(0.0, Math.min(100.0, Math.round(score * 100.0)));
  
  const reasons: string[] = [];
  if (profile.personality_traits) reasons.push(`Traits: ${Array.isArray(profile.personality_traits) ? profile.personality_traits.join(', ') : profile.personality_traits}`);
  if (profile.values) reasons.push(`Values: ${Array.isArray(profile.values) ? profile.values.join(', ') : profile.values}`);
  if (profile.interests) {
    const interestsList = Array.isArray(profile.interests) ? profile.interests : tryParseStringList(profile.interests) || [];
    reasons.push(`Interests: ${interestsList.slice(0, 6).join(', ')}`);
  }
  
  const bioSnip = profile.bio ? (profile.bio.length > 140 ? profile.bio.substring(0, 140) + "..." : profile.bio) : "";
  if (bioSnip) reasons.push(`Bio: "${bioSnip}"`);
  
  const reason = reasons.length > 0 ? reasons.join(" | ") : "Based on available profile fields.";
  
  return {
    score: score100,
    reason,
    breakdown: { big5, metadata, weights_used: weights }
  };
}

// Preference Compatibility Scoring (QCS)
function preferenceCompatibilityScore(seeker: any, candidate: any): number {
  const scores: number[] = [];
  const weights: number[] = [];

  // Gender preference matching
  if (seeker.preferredGender || seeker.preferred_gender) {
    const preferredGenders = tryParseStringList(seeker.preferredGender || seeker.preferred_gender) || [];
    const candidateGender = (candidate.gender || "").toLowerCase();
    const match = preferredGenders.includes("all") || preferredGenders.includes(candidateGender);
    scores.push(match ? 1.0 : 0.0);
    weights.push(2.0);
  }

  // Age compatibility
  if (seeker.ageRangeMin && seeker.ageRangeMax && candidate.date_of_birth) {
    try {
      const candidateAge = Math.floor((Date.now() - new Date(candidate.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (seeker.ageRangeMin <= candidateAge && candidateAge <= seeker.ageRangeMax) {
        scores.push(1.0);
      } else {
        const diff = Math.min(Math.abs(candidateAge - seeker.ageRangeMin), Math.abs(candidateAge - seeker.ageRangeMax));
        scores.push(Math.max(0.0, 1.0 - (diff / 10.0)));
      }
      weights.push(1.5);
    } catch (e) {
      scores.push(0.5);
      weights.push(1.5);
    }
  }

  // Height compatibility
  if (seeker.heightRangeMin && seeker.heightRangeMax && candidate.height) {
    const height = parseFloat(String(candidate.height));
    if (seeker.heightRangeMin <= height && height <= seeker.heightRangeMax) {
      scores.push(1.0);
    } else {
      const diff = Math.min(Math.abs(height - seeker.heightRangeMin), Math.abs(height - seeker.heightRangeMax));
      scores.push(Math.max(0.0, 1.0 - (diff / 80.0)));
    }
    weights.push(1.0);
  }

  // Overlap scoring function (Jaccard similarity)
  const overlapScore = (listA: string[], listB: string[]): number => {
    if (!listA || !listB || listA.length === 0 || listB.length === 0) return 0.0;
    
    const setA = new Set(listA.map(x => x.toLowerCase()));
    const setB = new Set(listB.map(x => x.toLowerCase()));
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return union.size > 0 ? intersection.size / union.size : 0.0;
  };

  // Values compatibility
  const seekerValues = tryParseStringList(seeker.preferredValues || seeker.preferred_values);
  const candidateValues = tryParseStringList(candidate.values);
  if (seekerValues && candidateValues) {
    scores.push(overlapScore(seekerValues, candidateValues));
    weights.push(1.2);
  }

  // Personality compatibility
  const seekerPersonality = tryParseStringList(seeker.preferredPersonality || seeker.preferred_personality);
  const candidatePersonality = tryParseStringList(candidate.personality_traits || candidate.personality_type);
  if (seekerPersonality && candidatePersonality) {
    scores.push(overlapScore(seekerPersonality, candidatePersonality));
    weights.push(1.5);
  }

  // Relationship goals compatibility
  const seekerGoals = tryParseStringList(seeker.preferredRelationshipGoals || seeker.preferred_relationship_goals);
  const candidateGoals = tryParseStringList(candidate.relationshipGoals || candidate.relationship_goals);
  if (seekerGoals && candidateGoals) {
    scores.push(overlapScore(seekerGoals, candidateGoals));
    weights.push(1.0);
  }

  if (weights.length === 0) return 50.0;

  const weightedSum = scores.reduce((sum, score, i) => sum + (score * weights[i]), 0);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  return Math.max(0.0, Math.min(100.0, (weightedSum / totalWeight) * 100.0));
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

// Per-user circuit breaker helpers
async function recordAiFailure(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_failure_count', { p_user_id: userId });
    if (error) {
      console.error('Failed to record AI failure:', error.message);
    }
  } catch (error) {
    console.error('Error recording AI failure:', error.message);
  }
}

async function resetAiFailures(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('reset_ai_failures', { p_user_id: userId });
    if (error) {
      console.error('Failed to reset AI failures:', error.message);
    }
  } catch (error) {
    console.error('Error resetting AI failures:', error.message);
  }
}

async function getPerUserBackoffInfo(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('ai_request_failures')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Failed to read ai_request_failures:', error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting backoff info:', error.message);
    return null;
  }
}

// Enhanced OpenAI call with per-user circuit breaker
async function callOpenAIWithFallback(
  messages: Array<{ role: string; content: string }>,
  userId: string,
  operationType: 'refinement' | 'predictive'
): Promise<any> {
  // Check per-user circuit breaker
  const backoffInfo = await getPerUserBackoffInfo(userId);
  if (backoffInfo?.next_allowed_at && new Date(backoffInfo.next_allowed_at) > new Date()) {
    console.log(`AI request blocked by per-user circuit breaker for ${userId}, next allowed: ${backoffInfo.next_allowed_at}`);
    return null;
  }

  try {
    const result = await sendOpenAIRequest({
      apiKey: openaiApiKey,
      messages,
      maxTokens: 400,
      parseJson: true
    });

    console.log(`OpenAI ${operationType} success for user ${userId} using model ${result.model}`);
    
    // Reset failures on success
    await resetAiFailures(userId);
    
    return { parsedContent: result.parsedContent, model: result.model, success: true };
    
  } catch (error) {
    console.log(`OpenAI ${operationType} failed for user ${userId}:`, error.message);
    
    // Record failure for this user
    await recordAiFailure(userId);
    
    return null;
  }
}

// AI refinement using robust OpenAI client
async function aiRefinement(
  profile: any,
  rawScore: number, 
  behaviors: string[], 
  persona: string,
  userId: string
) {
  const messages = [
    {
      role: 'system',
      content: 'You are a comprehensive dating profile evaluator. Return valid JSON with refined score and reasoning.'
    },
    {
      role: 'user',
      content: `Profile Analysis:
Bio: ${profile.bio || 'Not provided'}
Personality: ${JSON.stringify(profile.personality_traits || profile.personality_type || 'Not provided')}
Values: ${JSON.stringify(profile.values || 'Not provided')}
Interests: ${JSON.stringify(profile.interests || 'Not provided')}
Education: ${profile.field_of_study || 'Not provided'}

Rule-based Score: ${rawScore}
Detected Persona: ${persona}
Key Behaviors: ${behaviors.join(', ')}

Return JSON: {"final_score": number, "reason": "string", "persona": "${persona}", "insights": "brief analysis"}`
    }
  ];

  const result = await callOpenAIWithFallback(messages, userId, 'refinement');
  
  if (!result) {
    console.log(`AI refinement fallback for user ${userId}: using deterministic score`);
    return { 
      final_score: rawScore, 
      reason: 'Comprehensive deterministic calculation (AI fallback)', 
      persona,
      insights: 'Rule-based multi-dimensional analysis',
      ai_status: 'fallback'
    };
  }

  try {
    const parsed = result.parsedContent;
    if (parsed && typeof parsed.final_score === 'number') {
      // Validate and clamp the score
      parsed.final_score = Math.max(0, Math.min(100, Math.round(parsed.final_score)));
      return { ...parsed, ai_status: 'success', model: result.model };
    } else {
      throw new Error('Invalid AI response format');
    }
  } catch (parseError) {
    console.log(`AI refinement parse failed for user ${userId}, using fallback`);
    return { 
      final_score: rawScore, 
      reason: 'Comprehensive deterministic calculation (parse fallback)', 
      persona,
      insights: 'Rule-based multi-dimensional analysis',
      ai_status: 'fallback'
    };
  }
}

// AI predictive scoring with robust client
async function aiPredictive(profile: any, perCategoryFraction: Record<string, number>, userId: string) {
  const messages = [
    {
      role: 'system',
      content: 'You are a psychologist that predicts dating compatibility using comprehensive profile analysis. Return valid JSON.'
    },
    {
      role: 'user',
      content: `Comprehensive Profile Analysis:
Bio Quality: ${profile.bio ? `"${profile.bio.substring(0, 100)}..." (${profile.bio.length} chars)` : 'Missing'}
Personality: ${JSON.stringify(profile.personality_traits || 'Unknown')}
Values: ${JSON.stringify(profile.values || 'Unknown')} 
Interests: ${JSON.stringify(profile.interests || 'Unknown')}
Education: ${profile.field_of_study || 'Unknown'}
Category Scores: ${JSON.stringify(perCategoryFraction)}

Return JSON: {"predicted_score": number, "insights": "analysis", "red_flags": "concerns", "compatibility_factors": "strengths"}`
    }
  ];

  const result = await callOpenAIWithFallback(messages, userId, 'predictive');
  
  if (!result) {
    console.log(`AI predictive fallback for user ${userId}: using comprehensive deterministic score`);
    const fallbackScore = generateFallbackPredictiveScore(profile);
    return { 
      predicted_score: fallbackScore,
      insights: 'Comprehensive deterministic analysis based on multi-dimensional profile evaluation (AI fallback)',
      red_flags: perCategoryFraction.bio < 0.3 ? 'Limited bio information' : '',
      compatibility_factors: Object.entries(perCategoryFraction).filter(([_, v]) => v > 0.7).map(([k, _]) => k).join(', ') || 'Balanced profile',
      ai_status: 'fallback'
    };
  }

  try {
    const parsed = result.parsedContent;
    if (parsed && typeof parsed.predicted_score === 'number') {
      // Normalize score (handle 0-10 scale)
      if (parsed.predicted_score >= 0 && parsed.predicted_score <= 10) {
        parsed.predicted_score = Math.floor(parsed.predicted_score * 10);
      }
      parsed.predicted_score = Math.max(0, Math.min(100, Math.round(parsed.predicted_score)));
      
      return { ...parsed, ai_status: 'success', model: result.model };
    } else {
      throw new Error('Invalid AI response format');
    }
  } catch (parseError) {
    console.log(`AI predictive parse failed for user ${userId}, using fallback`);
    const fallbackScore = generateFallbackPredictiveScore(profile);
    return { 
      predicted_score: fallbackScore,
      insights: 'Comprehensive deterministic analysis (parse fallback)',
      red_flags: perCategoryFraction.bio < 0.3 ? 'Limited bio information' : '',
      compatibility_factors: Object.entries(perCategoryFraction).filter(([_, v]) => v > 0.7).map(([k, _]) => k).join(', ') || 'Balanced profile',
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

// Main scoring pipeline with comprehensive algorithm and robust AI integration + Big-5 model
async function finalCustomerScoring(profile: any, userId: string, aiWeight: number = 0.5) {
  // Use comprehensive deterministic scoring
  const { score: ruleScore, perCategoryFraction } = deterministicScoring(profile);
  const persona = assignPersona(profile);

  // Add local psychology model assessment
  const psychAssessment = psychModelAssessor(profile);
  console.log(`Local psychology assessment for user ${userId}: score=${psychAssessment.score}, reason="${psychAssessment.reason}"`);

  console.log(`Starting comprehensive QCS calculation for user ${userId}: per-user circuit breaker check`);

  // Create behaviors array from category fractions for compatibility
  const behaviors: string[] = [];
  Object.entries(perCategoryFraction).forEach(([category, fraction]) => {
    if (fraction > 0.8) behaviors.push(`Strong ${category} profile`);
    else if (fraction > 0.6) behaviors.push(`Good ${category} traits`);
    else if (fraction < 0.3) behaviors.push(`Needs ${category} improvement`);
  });

  // AI refinement with error handling (optional)
  let aiRefinedResult = await aiRefinement(profile, ruleScore, behaviors, persona, userId);

  // AI predictive scoring (optional)
  let aiPredictiveResult = await aiPredictive(profile, perCategoryFraction, userId);

  // Hybrid AI psychology scoring (local model + optional remote AI)
  let hybridPsychScore = psychAssessment.score;
  let aiPsychReason = psychAssessment.reason;
  let aiSource = 'local';

  // Try to enhance with remote AI if available and not circuit-broken
  if (aiRefinedResult.ai_status === 'success' || aiPredictiveResult.ai_status === 'success') {
    // Use available AI score as enhancement
    const aiScore = aiRefinedResult.ai_status === 'success' ? aiRefinedResult.final_score : aiPredictiveResult.predicted_score;
    hybridPsychScore = blendScore(psychAssessment.score, aiScore, 0.3); // 70% local, 30% AI
    aiSource = 'hybrid';
    aiPsychReason = `Hybrid: ${psychAssessment.reason} + AI enhancement`;
  }

  // Final blended score using aiWeight parameter
  const finalBlendedScore = blendScore(ruleScore, hybridPsychScore, aiWeight);

  // Log AI status for monitoring
  const aiStatus = {
    refinement_status: aiRefinedResult.ai_status || 'unknown',
    predictive_status: aiPredictiveResult.ai_status || 'unknown',
    psychology_model: aiSource,
    psychology_score: hybridPsychScore,
    ai_weight_used: aiWeight,
    final_blended_score: finalBlendedScore,
    circuit_breaker_per_user: true,
    scoring_version: 'comprehensive-v4-big5-hybrid'
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
    psychology_model: {
      score: psychAssessment.score,
      reason: aiPsychReason,
      breakdown: psychAssessment.breakdown,
      source: aiSource
    },
    ai_based: aiPredictiveResult,
    final_score: finalBlendedScore,
    ai_status: aiStatus,
    final_judgment: 'Comprehensive multi-dimensional scoring with Big-5 psychology model and AI enhancement'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let userId: string | null = null; // Declare userId at function scope
  
  try {
    // Read body once and allow explicit user_id to be provided
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    // Determine target user id
    userId = body?.user_id ?? null;

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
    let scoringResult: any = { ai_status: { refinement_status: 'skipped', predictive_status: 'skipped' }, rule_based: { final_score: 0 } };
    let aiScore = 0;
    
    // Extract AI weight from request body (default 0.5 for 50/50 blend)
    const aiWeight = Math.max(0, Math.min(1, parseFloat(body?.ai_weight) || 0.5));
    
    try {
      if (openaiApiKey) {
        scoringResult = await finalCustomerScoring(fullProfile, userId, aiWeight);
        aiScore = scoringResult.final_score || scoringResult.rule_based.final_score || scoringResult.rule_based.base_score || 50;
      } else {
        // No OpenAI key: skip AI path entirely, use local psychology model only
        scoringResult = await finalCustomerScoring(fullProfile, userId, 0.0); // 100% deterministic
        aiScore = scoringResult.final_score || 0;
        scoringResult.ai_status = { refinement_status: 'disabled', predictive_status: 'disabled' };
      }
    } catch (e) {
      console.log('AI scoring path failed, proceeding with deterministic only:', (e as Error).message);
      // Fallback with pure deterministic scoring
      scoringResult = await finalCustomerScoring(fullProfile, userId, 0.0);
      aiScore = scoringResult.final_score || 0;
    }

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

    // Enhanced blending logic - use the final blended score from comprehensive scoring
    const aiRefinedScore = scoringResult.psychology_model?.score || scoringResult.rule_based?.final_score;
    const validAiScore = (typeof aiRefinedScore === 'number' && aiRefinedScore > 0 && !isNaN(aiRefinedScore)) ? aiRefinedScore : null;
    
    // Use the final score from comprehensive algorithm
    const totalQcs = scoringResult.final_score || blendScore(logicQcs, validAiScore, aiWeight);

    // Enhanced logging with AI status and psychology model
    const aiStatusSummary = { 
      ...scoringResult.ai_status, 
      psychology_model: scoringResult.psychology_model || {},
      ai_weight_used: aiWeight
    };
    console.log(`QCS calculated for ${userId}: Logic=${logicQcs}, Psychology=${scoringResult.psychology_model?.score || 'null'}, Final=${totalQcs} (Profile: ${profileScore}, College: ${collegeTier}, Personality: ${personalityDepth}, Behavior: ${behaviorScore}) | AI Status: ${JSON.stringify(aiStatusSummary)}`);

    // ATOMIC DATABASE UPDATE - Single transaction using stored procedure
    const { data: atomicResult, error: atomicError } = await supabase.rpc('atomic_qcs_update', {
      p_user_id: userId,
      p_total_score: totalQcs,
      p_logic_score: Math.round(logicQcs),
      p_ai_score: validAiScore ? Math.round(validAiScore) : null,
      p_ai_meta: aiStatusSummary ? JSON.stringify(aiStatusSummary) : null,
      p_per_category: JSON.stringify(perCategoryFraction),
      p_total_score_float: totalQcs
    });

    if (atomicError) {
      console.error(`Atomic QCS update failed for user ${userId}:`, atomicError.message);
      
      // Fallback to manual updates if atomic update fails
      try {
        await supabase.from('qcs').upsert({
          user_id: userId,
          profile_score: profileScore,
          college_tier: collegeTier,
          personality_depth: personalityDepth,
          behavior_score: behaviorScore,
          total_score: totalQcs,
          logic_score: Math.round(logicQcs),
          ai_score: validAiScore ? Math.round(validAiScore) : null,
          per_category: perCategoryFraction
        });
        
        await supabase.from('profiles')
          .update({ total_qcs: totalQcs, qcs_synced_at: new Date().toISOString() })
          .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`);
          
        console.log(`Fallback updates completed for user ${userId}`);
      } catch (fallbackError) {
        console.error(`Fallback updates also failed for user ${userId}:`, fallbackError.message);
      }
    } else {
      console.log(`Atomic QCS update successful for user ${userId}:`, atomicResult);
    }

    // Success response with enhanced metadata
    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      qcs: {
        total_score: totalQcs,
        logic_score: Math.round(logicQcs),
        ai_score: validAiScore ? Math.round(validAiScore) : null,
        profile_score: profileScore,
        college_tier: collegeTier,
        personality_depth: personalityDepth,
        behavior_score: behaviorScore
      },
      updated_qcs: totalQcs, // For compatibility with calculateQCS function
      final_score: totalQcs,
      scoring_details: scoringResult,
      ai_status: aiStatusSummary,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '4.0-big5-hybrid',
        atomic_update: !atomicError,
        ai_weight_used: aiWeight
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Enhanced error logging with user context (no PII)
    const errorType = error.name || 'UnknownError';
    const errorMessage = error.message || 'Unknown error';
    
    console.error(`QCS function error for user ${userId || 'unknown'}: ${errorType} - ${errorMessage}`);
    
    // For critical failures, attempt to provide fallback score
    try {
      // Do not sync fallback to DB; just return fallback in response
      const fallbackQcs = 60; // Safe middle-ground score

      return new Response(JSON.stringify({
        success: false,
        user_id: userId,
        qcs: {
          total_score: fallbackQcs,
          logic_score: fallbackQcs,
          ai_score: null,
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
          per_user_circuit_breaker: true
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0-robust-emergency'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fallbackError) {
      console.error(`Emergency fallback failed for user ${userId || 'unknown'}:`, fallbackError.message);
      
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