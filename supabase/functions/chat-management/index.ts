import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Use the service role key for admin privileges
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, ...body } = await req.json();

    switch (action) {
      case 'list': {
        const { user_id } = body;
        if (!user_id) throw new Error('User ID is required.');

        const { data: rooms, error } = await supabase
          .from('chat_rooms')
          .select(`
            *,
            user_a:profiles!user_a_id(id, first_name, last_name, profile_images, university),
            user_b:profiles!user_b_id(id, first_name, last_name, profile_images, university)
          `)
          .or(`user_a_id.eq.${user_id},user_b_id.eq.${user_id}`)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        
        // Determine the 'other_user' for each room
        const roomsWithOtherUser = rooms.map(room => {
            const other_user = room.user_a.id === user_id ? room.user_b : room.user_a;
            return { ...room, other_user };
        });

        return new Response(JSON.stringify({ success: true, data: roomsWithOtherUser }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // --- NEW ACTION TO FIX RLS ISSUE ---
      case 'get_messages': {
        const { chat_room_id } = body;
        if (!chat_room_id) throw new Error('Chat room ID is required.');

        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_room_id', chat_room_id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }

      case 'send': {
        const { chat_room_id, sender_id, message_text } = body;
        if (!chat_room_id || !sender_id || !message_text) {
          throw new Error('Missing required fields for sending a message.');
        }

        // Corrected insert operation
        const { data: insertedMessages, error: insertError } = await supabase
          .from('chat_messages')
          .insert({ chat_room_id, sender_id, message_text })
          .select();

        if (insertError) throw insertError;

        // Update the timestamp and last message on the chat room
        await supabase
            .from('chat_rooms')
            .update({ 
                updated_at: new Date().toISOString(), 
                last_message: message_text, 
                last_message_time: new Date().toISOString() 
            })
            .eq('id', chat_room_id);

        return new Response(JSON.stringify({ success: true, data: insertedMessages[0] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      
      default:
        throw new Error('Invalid action.');
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});