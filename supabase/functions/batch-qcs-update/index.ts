import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting batch QCS update for all profiles...');

    // Get all active profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, firebase_uid, first_name, last_name, bio')
      .eq('is_active', true)
      .limit(100); // Process in batches to avoid timeouts

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No profiles found to update',
        processed: 0,
        errors: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${profiles.length} profiles to process`);

    let processed = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // Process each profile
    for (const profile of profiles) {
      try {
        const userId = profile.firebase_uid || profile.user_id;
        console.log(`Processing QCS for user: ${userId} (${profile.first_name} ${profile.last_name})`);

        // Call the QCS scoring function
        const qcsResponse = await fetch(`${supabaseUrl}/functions/v1/qcs-scoring`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            // Let the function fetch profile data automatically
          }),
        });

        if (!qcsResponse.ok) {
          const errorText = await qcsResponse.text();
          throw new Error(`QCS scoring failed: ${errorText}`);
        }

        const qcsResult = await qcsResponse.json();
        console.log(`✅ QCS updated for ${userId}: ${qcsResult.updated_qcs || qcsResult.final_score}`);
        processed++;

        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing ${profile.user_id}:`, error);
        errors++;
        errorDetails.push(`${profile.user_id}: ${error.message}`);
      }
    }

    console.log(`Batch QCS update completed. Processed: ${processed}, Errors: ${errors}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Batch QCS update completed`,
      processed,
      errors,
      total_profiles: profiles.length,
      error_details: errorDetails.slice(0, 10) // Limit error details to first 10
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Batch QCS update failed:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      processed: 0,
      errors: 1
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});