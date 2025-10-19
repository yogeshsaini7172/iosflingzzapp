import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const surepassToken = Deno.env.get('SUREPASS_TOKEN');
    if (!surepassToken) {
      console.error('Missing SUREPASS_TOKEN environment variable');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { logo_url, skip_main_screen = true } = await req.json();

    // Determine environment (default to sandbox for safety)
    const environment = Deno.env.get('SUREPASS_ENV') || 'sandbox';
    const baseUrl = environment === 'production' 
      ? 'https://kyc-api.surepass.app' 
      : 'https://sandbox.surepass.app';

    console.log(`🔐 Initializing Digilocker (${environment})...`);

    // Call Digilocker Initialize API
    const response = await fetch(`${baseUrl}/api/v1/digilocker/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${surepassToken}`,
      },
      body: JSON.stringify({
        data: {
          signup_flow: true,
          logo_url: logo_url || undefined,
          skip_main_screen,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Digilocker API error:', result);
      return new Response(
        JSON.stringify({ 
          error: result.message || 'Failed to initialize verification',
          details: result 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Digilocker initialized successfully');

    return new Response(
      JSON.stringify({
        success: true,
        token: result.data.token,
        client_id: result.data.client_id,
        expiry_seconds: result.data.expiry_seconds,
        gateway: environment === 'production' ? 'production' : 'sandbox',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in digilocker-init:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
