// Health check endpoint for AI pipeline
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return new Response(JSON.stringify({
        status: 'unhealthy',
        error: 'OpenAI API key not configured',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test with sample profile data
    const testProfile = {
      bio: "Love traveling and reading. Computer science student at a top university.",
      personality_traits: ["adventurous", "intellectual"],
      values: ["career-focused"],
      interests: ["travel", "reading", "technology"],
      field_of_study: "computer science",
      body_type: "athletic"
    };

    const startTime = Date.now();

    try {
      const result = await sendOpenAIRequest({
        apiKey: openaiApiKey,
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a dating profile scorer. Return JSON only.'
          },
          {
            role: 'user',
            content: `Score this profile (0-100): ${JSON.stringify(testProfile)}. Return: {"score": number, "status": "healthy"}`
          }
        ],
        maxTokens: 200,
        parseJson: true
      });

      const duration = Date.now() - startTime;

      return new Response(JSON.stringify({
        status: 'healthy',
        ai_pipeline: {
          model_used: result.model,
          response_time_ms: duration,
          parsed_content: result.parsedContent,
          content_valid: typeof result.parsedContent?.score === 'number'
        },
        test_profile: testProfile,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (aiError) {
      return new Response(JSON.stringify({
        status: 'degraded',
        error: 'AI pipeline failed',
        ai_error: aiError.message,
        details: aiError.details || null,
        fallback_available: true,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});