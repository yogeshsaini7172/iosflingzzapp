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
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_id, first_name, university')
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      console.error('profile-status query error:', error);
      return new Response(JSON.stringify({ isComplete: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isComplete = !!(profile && profile.first_name && profile.university);

    return new Response(JSON.stringify({ isComplete }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('profile-status unexpected error:', e);
    return new Response(JSON.stringify({ isComplete: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});