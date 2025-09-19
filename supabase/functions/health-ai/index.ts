// Health check endpoint for AI pipeline
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sendOpenAIRequest } from '../../../lib/openai-client.ts';

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