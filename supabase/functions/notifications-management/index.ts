import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'list' | 'mark_read' | 'mark_all_read';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { action, user_id, notification_id } = await req.json();
    if (!user_id) throw new Error('user_id is required');

    switch (action as Action) {
      case 'list': {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'mark_read': {
        if (!notification_id) throw new Error('notification_id is required');
        const { error } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notification_id)
          .eq('user_id', user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'mark_all_read': {
        const { error } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user_id)
          .is('read_at', null);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});