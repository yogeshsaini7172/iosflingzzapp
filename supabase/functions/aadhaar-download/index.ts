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

    const { client_id } = await req.json();

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const environment = Deno.env.get('SUREPASS_ENV') || 'sandbox';
    const baseUrl = environment === 'production' 
      ? 'https://kyc-api.surepass.app' 
      : 'https://sandbox.surepass.app';

    console.log(`📥 Downloading Aadhaar data for client: ${client_id}`);

    // Call Digilocker Download API
    const response = await fetch(`${baseUrl}/api/v1/digilocker/download-aadhaar/${client_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${surepassToken}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Aadhaar download API error:', result);
      return new Response(
        JSON.stringify({ 
          error: result.message || 'Failed to download Aadhaar data',
          details: result 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Aadhaar data downloaded successfully');

    // Store verification data in identity_verifications table
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get user_id from JWT
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        try {
          const jwt = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(jwt);
          
          if (user) {
            // Update or create identity verification record
            await supabase
              .from('identity_verifications')
              .upsert({
                user_id: user.id,
                govt_id_status: 'verified',
                govt_id_verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            // Update profile verification status
            await supabase
              .from('profiles')
              .update({
                verification_status: 'verified',
                govt_id_verified: true,
                verified_at: new Date().toISOString(),
              })
              .eq('user_id', user.id);

            console.log('✅ Database updated with verification status');
          }
        } catch (dbError) {
          console.error('Database update error:', dbError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in aadhaar-download:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
