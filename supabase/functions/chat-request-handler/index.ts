import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-firebase-token',
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

    // Prefer Firebase token verification (Firebase-only auth)
    let effectiveUserId: string | null = null;
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (token) {
      try {
        const payloadPart = token.split('.')[1] || '';
        const payload = JSON.parse(atob(payloadPart));
        // Firebase tokens include both `sub` and sometimes `user_id`
        effectiveUserId = payload?.user_id || payload?.sub || null;
      } catch (_) {
        // Fallback: try Supabase JWT (unlikely in Firebase-only mode)
        const { data: userData } = await supabaseClient.auth.getUser(token);
        effectiveUserId = userData?.user?.id ?? null;
      }
    }
    if (!effectiveUserId) effectiveUserId = bodyUserId || sender_id || null;
    if (!effectiveUserId) throw new Error('Missing user identity');

    if (action === 'send_request') {
      // Check for existing chat request to prevent duplicates
      const { data: existingRequest } = await supabaseClient
        .from('chat_requests')
        .select('id, status')
        .eq('sender_id', effectiveUserId)
        .eq('recipient_id', recipient_id)
        .maybeSingle();

      if (existingRequest) {
        console.log('⚠️ Chat request already exists:', existingRequest);
        return new Response(JSON.stringify({ 
          success: true, 
          data: existingRequest,
          message: 'Chat request already sent'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Send new chat request
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

      if (requestError) {
        console.error('❌ Chat request creation error:', requestError);
        throw requestError;
      }

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
      // Respond to chat request (accept/decline) - ATOMIC VERSION
      if (status === 'accepted') {
        // Use atomic RPC function to prevent race conditions
        const { data: result, error: rpcError } = await supabaseClient
          .rpc('rpc_accept_chat_request', {
            p_chat_request_id: request_id,
            p_recipient_id: effectiveUserId
          });

        if (rpcError) {
          console.error('❌ RPC Error:', rpcError);
          throw new Error(`Failed to accept chat request: ${rpcError.message}`);
        }

        console.log('✅ Chat request accepted atomically:', result);
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: { 
            id: request_id, 
            status: 'accepted',
            match_id: result[0]?.match_id,
            chat_room_id: result[0]?.chat_room_id,
            created_match: result[0]?.created_match
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } else {
        // Handle decline (non-atomic, simpler case)
        const { data: existing, error: fetchErr } = await supabaseClient
          .from('chat_requests')
          .select('recipient_id')
          .eq('id', request_id)
          .single();
        
        if (fetchErr) throw fetchErr;
        if (existing.recipient_id !== effectiveUserId) throw new Error('Unauthorized');

        const { data: updatedRequest, error: updateError } = await supabaseClient
          .from('chat_requests')
          .update({ status: 'declined', updated_at: new Date().toISOString() })
          .eq('id', request_id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true, data: updatedRequest }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

    } else if (action === 'get_requests') {
      // Get pending chat requests for user
      const targetUserId = bodyUserId || sender_id || effectiveUserId;
      console.log(`🔍 Fetching chat requests for user: ${targetUserId}`);
      
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

      if (requestsError) {
        console.error('❌ Error fetching chat requests:', requestsError);
        throw requestsError;
      }

      console.log(`✅ Retrieved ${requests?.length || 0} chat requests`);
      
      return new Response(JSON.stringify({ success: true, data: requests || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Chat request handler error:', errorMessage, error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});