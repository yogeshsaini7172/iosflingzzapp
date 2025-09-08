import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  action: 'create' | 'send' | 'history' | 'list' | 'create_room' | 'send_message';
  candidate_id?: string;
  match_id?: string;
  message?: string;
  user_id?: string;
  other_user_id?: string;
  chat_room_id?: string;
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

    const { action, candidate_id, match_id, message, user_id, chat_room_id }: ChatRequest = await req.json();

    // Optional auth: try JWT, but allow unauthenticated for 'list' with explicit user_id
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const { data } = token ? await supabaseClient.auth.getUser(token) : { data: { user: null } } as any;
    const authedUser = data?.user;

    switch (action) {
      case 'create':
        if (!candidate_id) {
          throw new Error('Candidate ID is required');
        }
        if (!authedUser) throw new Error('User not authenticated');

        // Check if match already exists
        const { data: existingMatches } = await supabaseClient
          .from('matches')
          .select('*')
          .or(
            `and(liker_id.eq.${authedUser.id},liked_id.eq.${candidate_id}),and(liker_id.eq.${candidate_id},liked_id.eq.${authedUser.id})`
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
            liker_id: authedUser.id,
            liked_id: candidate_id,
            status: 'matched',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (matchError) throw matchError;

        console.log(`Chat created between ${authedUser.id} and ${candidate_id} | match_id=${newMatch.id}`);
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
        if (!authedUser) throw new Error('User not authenticated');

        // Verify user is part of this match
        const { data: match } = await supabaseClient
          .from('matches')
          .select('*')
          .eq('id', match_id)
          .single();

        if (!match || (match.liker_id !== authedUser.id && match.liked_id !== authedUser.id)) {
          throw new Error('Unauthorized: You are not part of this match');
        }

        // Send message
        const { data: sentMessage, error: messageError } = await supabaseClient
          .from('messages')
          .insert({
            match_id,
            sender_id: authedUser.id,
            content: message,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (messageError) throw messageError;

        console.log(`Message sent | match_id=${match_id} | sender=${authedUser.id}`);
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
        if (!authedUser) throw new Error('User not authenticated');

        // Verify user is part of this match
        const { data: matchForHistory } = await supabaseClient
          .from('matches')
          .select('*')
          .eq('id', match_id)
          .single();

        if (!matchForHistory || (matchForHistory.liker_id !== authedUser.id && matchForHistory.liked_id !== authedUser.id)) {
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

      case 'create_room':
        if (!user_id || !other_user_id) {
          throw new Error('user_id and other_user_id are required');
        }
        // Ensure consistent ordering
        const u1 = user_id < other_user_id ? user_id : other_user_id;
        const u2 = user_id < other_user_id ? other_user_id : user_id;

        // Check or create enhanced match
        const { data: existingEnhancedMatch } = await supabaseClient
          .from('enhanced_matches')
          .select('*')
          .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`)
          .maybeSingle();

        let ensuredMatch = existingEnhancedMatch;
        if (!ensuredMatch) {
          const { data: newEnsuredMatch, error: emErr } = await supabaseClient
            .from('enhanced_matches')
            .insert({
              user1_id: u1,
              user2_id: u2,
              status: 'matched',
              user1_swiped: true,
              user2_swiped: true
            })
            .select()
            .single();
          if (emErr) throw emErr;
          ensuredMatch = newEnsuredMatch;
        }

        // Check or create chat room
        const { data: existingRoom } = await supabaseClient
          .from('chat_rooms')
          .select('id')
          .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`)
          .maybeSingle();

        if (existingRoom) {
          return new Response(JSON.stringify({ success: true, data: existingRoom }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const { data: room, error: roomError } = await supabaseClient
          .from('chat_rooms')
          .insert({ match_id: ensuredMatch.id, user1_id: u1, user2_id: u2 })
          .select()
          .single();
        if (roomError) throw roomError;

        return new Response(JSON.stringify({ success: true, data: room }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'list':
        if (!user_id) throw new Error('user_id is required');
        // List chat rooms for a user and enrich with other user and last message
        const { data: rooms, error: roomsError } = await supabaseClient
          .from('chat_rooms')
          .select('id, match_id, user1_id, user2_id, updated_at, created_at')
          .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`)
          .order('updated_at', { ascending: false });
        if (roomsError) throw roomsError;

        const enriched = [] as any[];
        for (const room of rooms || []) {
          const otherUserId = room.user1_id === user_id ? room.user2_id : room.user1_id;
          const { data: otherUser } = await supabaseClient
            .from('profiles')
            .select('user_id, first_name, last_name, profile_images, university')
            .eq('user_id', otherUserId)
            .maybeSingle();
          const { data: lastMessage } = await supabaseClient
            .from('chat_messages_enhanced')
            .select('message_text, created_at')
            .eq('chat_room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          enriched.push({
            ...room,
            other_user: otherUser,
            last_message: lastMessage?.message_text || 'Start your conversation...',
            last_message_time: lastMessage?.created_at || room.updated_at,
          });
        }

        return new Response(JSON.stringify({ success: true, data: enriched }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'send_message':
        if (!chat_room_id || !message || !user_id) {
          throw new Error('chat_room_id, message, and user_id are required');
        }

        // Verify user is part of this chat room
        const { data: chatRoom } = await supabaseClient
          .from('chat_rooms')
          .select('user1_id, user2_id')
          .eq('id', chat_room_id)
          .single();

        if (!chatRoom || (chatRoom.user1_id !== user_id && chatRoom.user2_id !== user_id)) {
          throw new Error('Unauthorized: You are not part of this chat room');
        }

        // Send message to enhanced chat
        const { data: sentMessage, error: messageError } = await supabaseClient
          .from('chat_messages_enhanced')
          .insert({
            chat_room_id,
            sender_id: user_id,
            message_text: message,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (messageError) throw messageError;

        console.log(`Message sent to chat room ${chat_room_id} from ${user_id}`);
        return new Response(JSON.stringify({
          success: true,
          data: sentMessage,
          message: 'Message sent'
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