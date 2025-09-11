import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Testing pairing for user: DnGJgBsXcNa2pBC2yIpsae9rhYb2');

    // Call deterministic-pairing function
    const { data: pairingResult, error: pairingError } = await supabaseClient.functions.invoke(
      'deterministic-pairing',
      {
        body: { user_id: 'DnGJgBsXcNa2pBC2yIpsae9rhYb2' }
      }
    );

    if (pairingError) {
      console.error('Pairing function error:', pairingError);
      throw pairingError;
    }

    console.log('Pairing function result:', JSON.stringify(pairingResult, null, 2));

    // Also fetch user profile and preferences for context
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', 'DnGJgBsXcNa2pBC2yIpsae9rhYb2')
      .single();

    const { data: userPrefs } = await supabaseClient
      .from('partner_preferences')
      .select('*')
      .eq('user_id', 'DnGJgBsXcNa2pBC2yIpsae9rhYb2')
      .single();

    return new Response(JSON.stringify({
      user_profile: userProfile,
      user_preferences: userPrefs,
      pairing_results: pairingResult,
      analysis: {
        user_qcs: userProfile?.total_qcs,
        qcs_range: pairingResult?.user1?.qcs_range,
        total_candidates: pairingResult?.total_candidates_found,
        top_candidates_count: pairingResult?.top_candidates?.length,
        sample_scores: pairingResult?.top_candidates?.slice(0, 3).map((c: any) => ({
          name: c.candidate_name,
          physical_score: c.physical_score,
          mental_score: c.mental_score,
          final_score: c.final_score,
          matched: c.debug_info?.matched,
          not_matched: c.debug_info?.not_matched
        }))
      }
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});