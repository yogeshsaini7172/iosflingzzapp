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

    // Fix Alice's QCS score specifically
    const aliceUserId = '11111111-1111-1111-1111-111111111001';
    
    // Get QCS data
    const { data: qcsData, error: qcsError } = await supabaseClient
      .from('qcs')
      .select('*')
      .eq('user_id', aliceUserId)
      .single();

    if (qcsError) {
      console.error('QCS fetch error:', qcsError);
      throw qcsError;
    }

    // Calculate proper total score (normalize the 360 total to 0-100 scale)
    let finalScore = 87; // Use the calculated score from our QCS example
    
    if (qcsData && qcsData.total_score) {
      // If we have component scores, calculate properly
      const componentSum = (qcsData.profile_score || 0) + 
                          (qcsData.college_tier || 0) + 
                          (qcsData.personality_depth || 0) + 
                          (qcsData.behavior_score || 0);
      
      // Normalize to 0-100 scale
      finalScore = Math.min(100, Math.max(0, Math.floor(componentSum / 4)));
    }

    console.log('Updating Alice QCS to:', finalScore);

    // Update profiles table with correct QCS
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ total_qcs: finalScore })
      .eq('user_id', aliceUserId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw updateError;
    }

    // Also update the QCS table for consistency
    const { error: qcsUpdateError } = await supabaseClient
      .from('qcs')
      .update({ total_score: finalScore })
      .eq('user_id', aliceUserId);

    if (qcsUpdateError) {
      console.error('QCS update error:', qcsUpdateError);
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: aliceUserId,
      updated_qcs: finalScore,
      message: 'Alice\'s QCS score synchronized successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('QCS sync error:', errorMessage);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});