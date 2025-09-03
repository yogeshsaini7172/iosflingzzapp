import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileRequest {
  action: 'create' | 'update' | 'get';
  profile?: any;
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error('User not authenticated');

    const { action, profile: profileData }: ProfileRequest = await req.json();

    switch (action) {
      case 'create':
      case 'update':
        if (!profileData) {
          throw new Error('Profile data is required');
        }

        // Check if profile exists
        const { data: existingProfile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!existingProfile && action === 'create') {
          // Create new profile
          const newProfile = {
            user_id: user.id,
            email: user.email,
            ...profileData,
            // Initialize default values
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

          console.log(`Profile created for ${user.id}`);
          return new Response(JSON.stringify({
            success: true,
            data: { user_id: user.id, profile: createdProfile },
            message: 'Profile created'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });

        } else {
          // Update existing profile
          const updatedProfile = {
            ...profileData,
            updated_at: new Date().toISOString()
          };

          const { data: updated, error: updateError } = await supabaseClient
            .from('profiles')
            .update(updatedProfile)
            .eq('user_id', user.id)
            .select()
            .single();

          if (updateError) throw updateError;

          console.log(`Profile updated for ${user.id}`);
          return new Response(JSON.stringify({
            success: true,
            data: { user_id: user.id, profile: updated },
            message: 'Profile updated'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

      case 'get':
        const { data: profile, error: getError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (getError) throw getError;

        if (!profile) {
          throw new Error('Profile not found');
        }

        return new Response(JSON.stringify({
          success: true,
          data: { user_id: user.id, profile },
          message: 'Profile fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in profile-management function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});