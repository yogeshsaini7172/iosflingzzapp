import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OPENAI_API_KEY not configured',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🧪 Testing OpenAI API connection...');

    // Test basic OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a test assistant. Respond with exactly "API_TEST_SUCCESS"' },
          { role: 'user', content: 'Test' }
        ],
        max_tokens: 10,
        temperature: 0
      }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('❌ OpenAI API Error:', responseData);
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API call failed',
        status: response.status,
        details: responseData,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = responseData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('❌ Empty response from OpenAI:', responseData);
      return new Response(JSON.stringify({
        success: false,
        error: 'Empty content in OpenAI response',
        response: responseData,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ OpenAI API test successful:', content);

    return new Response(JSON.stringify({
      success: true,
      message: 'OpenAI API connection working',
      response: content,
      usage: responseData.usage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 OpenAI test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Network or API error',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});