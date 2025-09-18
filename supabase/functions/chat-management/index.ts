import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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

        // Get chat rooms
        const { data: rooms, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        
        // Get all unique user IDs from the rooms
        const allUserIds = new Set();
        rooms.forEach(room => {
          allUserIds.add(room.user1_id);
          allUserIds.add(room.user2_id);
        });

        // Fetch profiles for all users
        console.log('Looking for user IDs:', Array.from(allUserIds));
        
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, profile_images, university')
          .in('user_id', Array.from(allUserIds));

        console.log('Profiles found:', profiles);
        console.log('Profile error:', profileError);

        if (profileError) {
          console.warn('Could not fetch profiles:', profileError);
        }

        // Create a map of user_id to profile
        const profileMap = new Map();
        if (profiles) {
          profiles.forEach(profile => {
            profileMap.set(profile.user_id, profile);
          });
        }

        // Transform data to include other_user info with real profiles
        const roomsWithOtherUser = rooms.map(room => {
          const other_user_id = room.user1_id === user_id ? room.user2_id : room.user1_id;
          const otherUserProfile = profileMap.get(other_user_id);
          
          return { 
            ...room, 
            other_user: {
              id: other_user_id,
              first_name: otherUserProfile?.first_name || 'Unknown',
              last_name: otherUserProfile?.last_name || 'User',
              profile_images: otherUserProfile?.profile_images || [],
              university: otherUserProfile?.university || ''
            }
          };
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
          .from('chat_messages_enhanced')
          .select('*')
          .eq('chat_room_id', chat_room_id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }

      case 'create_room': {
        const { user1_id, user2_id, match_id } = body;
        if (!user1_id || !user2_id) {
          throw new Error('Both user IDs are required to create a chat room.');
        }

        // Check if chat room already exists
        const { data: existingRoom, error: checkError } = await supabase
          .from('chat_rooms')
          .select('*')
          .or(`and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`)
          .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existingRoom) {
          return new Response(JSON.stringify({ success: true, data: existingRoom }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Create new chat room
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            user1_id,
            user2_id,
            match_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify({ success: true, data: newRoom }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      case 'send': {
        const { chat_room_id, sender_id, message_text } = body;
        if (!chat_room_id || !sender_id || !message_text) {
          throw new Error('Missing required fields for sending a message.');
        }

        // Insert into chat_messages_enhanced table
        const { data: insertedMessages, error: insertError } = await supabase
          .from('chat_messages_enhanced')
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
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});