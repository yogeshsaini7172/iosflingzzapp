import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    console.log('OpenAI API Key available:', !!openaiApiKey);
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not found in environment');
    }

    // Test request body similar to qcs-scoring
    const requestBody = {
      model: 'gpt-5-mini-2025-08-07',
      max_completion_tokens: 100,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: 'Return a simple JSON response: {"test": "success", "status": "working"}'
        }
      ],
    };

    console.log('Making OpenAI request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('OpenAI error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response data:', JSON.stringify(data, null, 2));

    // Check response structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.log('Invalid response structure - no choices array');
      return new Response(JSON.stringify({
        error: 'Invalid OpenAI response structure',
        data
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = data.choices[0]?.message?.content;
    console.log('Extracted content:', content);
    console.log('Content type:', typeof content);
    console.log('Content length:', content?.length);
    console.log('Content truthy:', !!content);

    return new Response(JSON.stringify({
      success: true,
      content,
      rawResponse: data,
      analysis: {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasContent: !!content,
        contentLength: content?.length,
        contentType: typeof content
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Test OpenAI error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});