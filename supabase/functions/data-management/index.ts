import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DataRequest {
  action: 'get_profile' | 'update_profile' | 'get_preferences' | 'update_preferences' | 'get_feed' | 'get_pairing_feed' | 'create_profile';
  user_id?: string;
  profile?: any;
  preferences?: any;
  filters?: any;
  limit?: number;
}

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

    const authHeader = req.headers.get('Authorization');
    let userId: string;
    
    // Extract user_id from Firebase token or use provided user_id
    if (authHeader?.startsWith('Bearer dummy-token-')) {
      userId = authHeader.replace('Bearer dummy-token-', '');
    } else if (authHeader?.startsWith('Bearer firebase-')) {
      userId = authHeader.replace('Bearer firebase-', '');
    } else {
      // For firebase auth, extract from JWT - for now use fallback
      userId = 'default-user';
    }

    const { action, user_id, profile: profileData, preferences: preferencesData, filters, limit }: DataRequest = await req.json();
    
    // Use provided user_id if available (for direct calls)
    const finalUserId = user_id || userId;

    console.log(`[DATA-MANAGEMENT] Action: ${action}, User: ${finalUserId}`);

    switch (action) {
      case 'create_profile':
        if (!profileData) {
          throw new Error('Profile data is required');
        }

        const newProfile = {
          user_id: finalUserId,
          email: profileData.email || 'user@example.com',
          ...profileData,
          subscription_tier: 'free',
          daily_outgoing_matches: 0,
          daily_incoming_matches: 0,
          pairing_requests_left: 1,
          blinddate_requests_left: 0,
          swipes_left: 20,
          last_reset: new Date().toISOString(),
          show_profile: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdProfile, error: createError } = await supabaseClient
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;

        console.log(`[DATA-MANAGEMENT] Profile created for ${finalUserId}`);
        return new Response(JSON.stringify({
          success: true,
          data: { user_id: finalUserId, profile: createdProfile },
          message: 'Profile created'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_profile':
        const { data: profile, error: getError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', finalUserId)
          .single();

        if (getError && getError.code !== 'PGRST116') {
          throw getError;
        }

        return new Response(JSON.stringify({
          success: true,
          data: { user_id: finalUserId, profile },
          message: 'Profile fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'update_profile':
        if (!profileData) {
          throw new Error('Profile data is required');
        }

        const updatedProfileData = {
          ...profileData,
          updated_at: new Date().toISOString()
        };

        const { data: updated, error: updateError } = await supabaseClient
          .from('profiles')
          .update(updatedProfileData)
          .eq('user_id', finalUserId)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log(`[DATA-MANAGEMENT] Profile updated for ${finalUserId}`);
        return new Response(JSON.stringify({
          success: true,
          data: { user_id: finalUserId, profile: updated },
          message: 'Profile updated'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_preferences':
        const { data: preferences, error: prefError } = await supabaseClient
          .from('partner_preferences')
          .select('*')
          .eq('user_id', finalUserId)
          .single();

        if (prefError && prefError.code !== 'PGRST116') {
          throw prefError;
        }

        return new Response(JSON.stringify({
          success: true,
          data: { user_id: finalUserId, preferences },
          message: 'Preferences fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'update_preferences':
        if (!preferencesData) {
          throw new Error('Preferences data is required');
        }

        // Check if record exists
        const { data: existingPrefs } = await supabaseClient
          .from('partner_preferences')
          .select('user_id')
          .eq('user_id', finalUserId)
          .single();

        let prefResult;
        if (existingPrefs) {
          const { data, error } = await supabaseClient
            .from('partner_preferences')
            .update({ ...preferencesData, updated_at: new Date().toISOString() })
            .eq('user_id', finalUserId)
            .select()
            .single();
          prefResult = { data, error };
        } else {
          const { data, error } = await supabaseClient
            .from('partner_preferences')
            .insert({ user_id: finalUserId, ...preferencesData })
            .select()
            .single();
          prefResult = { data, error };
        }

        if (prefResult.error) throw prefResult.error;

        console.log(`[DATA-MANAGEMENT] Preferences updated for ${finalUserId}`);
        return new Response(JSON.stringify({
          success: true,
          data: { user_id: finalUserId, preferences: prefResult.data },
          message: 'Preferences updated'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_feed':
        // Fetch general feed excluding current user
        const { data: feedProfiles, error: feedError } = await supabaseClient
          .from('profiles')
          .select('*')
          .neq('user_id', finalUserId)
          .eq('is_active', true)
          .limit(limit || 20);

        if (feedError) throw feedError;

        console.log(`[DATA-MANAGEMENT] Feed fetched: ${feedProfiles?.length} profiles`);
        return new Response(JSON.stringify({
          success: true,
          data: { profiles: feedProfiles || [] },
          message: 'Feed fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_pairing_feed':
        // Enhanced pairing feed with filtering
        let query = supabaseClient
          .from('profiles')
          .select('*')
          .neq('user_id', finalUserId)
          .eq('is_active', true);

        // Apply filters if provided
        if (filters?.ageMin || filters?.ageMax) {
          if (filters.ageMin) {
            const minDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - filters.ageMax || 50);
            query = query.gte('date_of_birth', minDate.toISOString().split('T')[0]);
          }
          if (filters.ageMax) {
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() - filters.ageMin || 18);
            query = query.lte('date_of_birth', maxDate.toISOString().split('T')[0]);
          }
        }

        query = query.limit(limit || 10);

        const { data: pairingProfiles, error: pairingError } = await query;

        if (pairingError) throw pairingError;

        console.log(`[DATA-MANAGEMENT] Pairing feed fetched: ${pairingProfiles?.length} profiles`);
        return new Response(JSON.stringify({
          success: true,
          data: { profiles: pairingProfiles || [] },
          message: 'Pairing feed fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('[DATA-MANAGEMENT] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});