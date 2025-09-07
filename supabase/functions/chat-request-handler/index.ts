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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');

    const { action, recipient_id, message, request_id, status } = await req.json();

    if (action === 'send_request') {
      // Send chat request
      const { data: chatRequest, error: requestError } = await supabaseClient
        .from('chat_requests')
        .insert({
          sender_id: user.id,
          recipient_id,
          message: message || 'Hi! I would love to chat with you 😊',
          compatibility_score: Math.floor(Math.random() * 30) + 70 // Demo score
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create notification for recipient
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: recipient_id,
          type: 'chat_request',
          title: 'New Chat Request 💬',
          message: `Someone wants to chat with you!`,
          data: { sender_id: user.id, request_id: chatRequest.id }
        });

      return new Response(JSON.stringify({
        success: true,
        data: chatRequest
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (action === 'respond_request') {
      // Respond to chat request (accept/decline)
      const { data: updatedRequest, error: updateError } = await supabaseClient
        .from('chat_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', request_id)
        .eq('recipient_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (status === 'accepted') {
        // Create chat room when request is accepted
        const { data: chatRoom, error: roomError } = await supabaseClient.functions.invoke('chat-management', {
          body: {
            action: 'create_room',
            user_id: user.id,
            other_user_id: updatedRequest.sender_id,
          }
        });

        if (roomError) {
          console.error('Chat room creation failed:', roomError);
        }

        // Notify sender of acceptance
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: updatedRequest.sender_id,
            type: 'chat_request_accepted',
            title: 'Chat Request Accepted! 🎉',
            message: 'Your chat request was accepted. Start chatting now!',
            data: { chat_room_id: chatRoom?.data?.id }
          });
      }

      return new Response(JSON.stringify({
        success: true,
        data: updatedRequest
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (action === 'get_requests') {
      // Get pending chat requests for user
      const { data: requests, error: requestsError } = await supabaseClient
        .from('chat_requests')
        .select(`
          *,
          sender:profiles!chat_requests_sender_id_fkey(
            user_id,
            first_name,
            last_name,
            profile_images,
            university
          )
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      return new Response(JSON.stringify({
        success: true,
        data: requests || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Chat request handler error:', errorMessage);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});