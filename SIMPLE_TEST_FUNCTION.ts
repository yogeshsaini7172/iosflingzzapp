// ULTRA SIMPLE TEST - Deploy this first to verify deployment works
// If this works, then we know the issue is in our main function code

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

serve(async (req) => {
  console.log(`${req.method} request received from ${req.headers.get('origin')}`);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('Returning OPTIONS response');
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
  // Handle POST
  try {
    console.log('Processing POST request');
    const body = await req.json();
    console.log('Body:', body);
    
    const response = {
      success: true,
      message: 'Test function works!',
      received: body,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending response:', response);
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
