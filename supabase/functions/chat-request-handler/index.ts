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

    // Parse body early
    const body = await req.json();
    const { action, recipient_id, message, request_id, status, user_id: bodyUserId, sender_id } = body;

    // Try Supabase auth, but fall back to user_id from body (Firebase-only auth)
    let effectiveUserId: string | null = null;
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    if (token) {
      const { data: userData } = await supabaseClient.auth.getUser(token);
      effectiveUserId = userData?.user?.id ?? null;
    }
    if (!effectiveUserId) effectiveUserId = bodyUserId || sender_id || null;
    if (!effectiveUserId) throw new Error('Missing user identity');

    if (action === 'send_request') {
      // Send chat request
      const { data: chatRequest, error: requestError } = await supabaseClient
        .from('chat_requests')
        .insert({
          sender_id: effectiveUserId,
          recipient_id,
          message: message || 'Hi! I would love to chat with you 😊',
          compatibility_score: Math.floor(Math.random() * 30) + 70
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
          data: { sender_id: effectiveUserId, request_id: chatRequest.id }
        });

      return new Response(JSON.stringify({ success: true, data: chatRequest }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (action === 'respond_request') {
      // Respond to chat request (accept/decline)
      const { data: existing, error: fetchErr } = await supabaseClient
        .from('chat_requests')
        .select('recipient_id, sender_id')
        .eq('id', request_id)
        .single();
      if (fetchErr) throw fetchErr;
      if (existing.recipient_id !== effectiveUserId) throw new Error('Unauthorized');

      const { data: updatedRequest, error: updateError } = await supabaseClient
        .from('chat_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', request_id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (status === 'accepted') {
        // Create chat room when request is accepted
        const { data: chatRoom } = await supabaseClient.functions.invoke('chat-management', {
          body: {
            action: 'create_room',
            user_id: effectiveUserId,
            other_user_id: updatedRequest.sender_id,
          }
        });

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

      return new Response(JSON.stringify({ success: true, data: updatedRequest }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (action === 'get_requests') {
      // Get pending chat requests for user
      const targetUserId = bodyUserId || sender_id || effectiveUserId;
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
        .eq('recipient_id', targetUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      return new Response(JSON.stringify({ success: true, data: requests || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Chat request handler error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});