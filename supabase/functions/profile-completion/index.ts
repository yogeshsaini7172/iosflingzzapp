import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      university,
      qcsScore
    } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Completing profile for user:', userId);

    // Upsert profile with service role (bypasses RLS) - creates if doesn't exist
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        gender: gender,
        university: university,
        verification_status: 'verified',
        is_active: true,
        last_active: new Date().toISOString(),
        total_qcs: qcsScore || 0,
        email: '' // Default empty email for Firebase users
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
      throw upsertError;
    }

    console.log('Successfully completed profile for user:', userId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Profile completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in profile-completion function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});