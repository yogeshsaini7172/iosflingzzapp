import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
<parameter name="content">import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  action: 'create' | 'send' | 'history';
  candidate_id?: string;
  match_id?: string;
  message?: string;
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

    const { action, candidate_id, match_id, message }: ChatRequest = await req.json();

    switch (action) {
      case 'create':
        if (!candidate_id) {
          throw new Error('Candidate ID is required');
        }

        // Check if match already exists
        const { data: existingMatches } = await supabaseClient
          .from('matches')
          .select('*')
          .or(
            `and(liker_id.eq.${user.id},liked_id.eq.${candidate_id}),and(liker_id.eq.${candidate_id},liked_id.eq.${user.id})`
          );

        if (existingMatches && existingMatches.length > 0) {
          return new Response(JSON.stringify({
            success: true,
            data: { match_id: existingMatches[0].id, status: existingMatches[0].status },
            message: 'Chat already exists'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Create new match
        const { data: newMatch, error: matchError } = await supabaseClient
          .from('matches')
          .insert({
            liker_id: user.id,
            liked_id: candidate_id,
            status: 'matched',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (matchError) throw matchError;

        console.log(`Chat created between ${user.id} and ${candidate_id} | match_id=${newMatch.id}`);
        return new Response(JSON.stringify({
          success: true,
          data: { match_id: newMatch.id, status: 'active' },
          message: 'Chat created'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'send':
        if (!match_id || !message) {
          throw new Error('Match ID and message are required');
        }

        // Verify user is part of this match
        const { data: match } = await supabaseClient
          .from('matches')
          .select('*')
          .eq('id', match_id)
          .single();

        if (!match || (match.liker_id !== user.id && match.liked_id !== user.id)) {
          throw new Error('Unauthorized: You are not part of this match');
        }

        // Send message
        const { data: sentMessage, error: messageError } = await supabaseClient
          .from('messages')
          .insert({
            match_id,
            sender_id: user.id,
            content: message,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (messageError) throw messageError;

        console.log(`Message sent | match_id=${match_id} | sender=${user.id}`);
        return new Response(JSON.stringify({
          success: true,
          data: sentMessage,
          message: 'Message sent'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'history':
        if (!match_id) {
          throw new Error('Match ID is required');
        }

        // Verify user is part of this match
        const { data: matchForHistory } = await supabaseClient
          .from('matches')
          .select('*')
          .eq('id', match_id)
          .single();

        if (!matchForHistory || (matchForHistory.liker_id !== user.id && matchForHistory.liked_id !== user.id)) {
          throw new Error('Unauthorized: You are not part of this match');
        }

        // Get chat history
        const { data: messages, error: historyError } = await supabaseClient
          .from('messages')
          .select('*')
          .eq('match_id', match_id)
          .order('created_at', { ascending: true });

        if (historyError) throw historyError;

        if (!messages || messages.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'No messages found'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          data: messages,
          message: 'Chat history fetched'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in chat-management function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});