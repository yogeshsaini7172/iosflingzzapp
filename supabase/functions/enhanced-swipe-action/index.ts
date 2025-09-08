import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SwipeRequest {
  user_id: string;
  target_user_id: string;
  direction: 'left' | 'right';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    )

    const { user_id, target_user_id, direction }: SwipeRequest = await req.json()

    if (!user_id || !target_user_id || !direction) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Record the swipe
    const { error: swipeError } = await supabaseClient
      .from('enhanced_swipes')
      .insert({
        user_id,
        target_user_id,
        direction
      })

    if (swipeError) {
      console.error('Error recording swipe:', swipeError)
      return new Response(
        JSON.stringify({ error: 'Failed to record swipe' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let isMatch = false
    let chatRoomId = null
    let matchResult = null

    // If right swipe, check for match
    if (direction === 'right') {
      const { data: otherSwipe, error: matchError } = await supabaseClient
        .from('enhanced_swipes')
        .select('*')
        .eq('user_id', target_user_id)
        .eq('target_user_id', user_id)
        .eq('direction', 'right')
        .maybeSingle()

      if (matchError) {
        console.error('Error checking for match:', matchError)
      } else if (otherSwipe) {
        // Create match and chat room directly using service role client
        try {
          // Determine deterministic user ordering
          const user1 = user_id < target_user_id ? user_id : target_user_id;
          const user2 = user_id < target_user_id ? target_user_id : user_id;

          // Insert or get existing match
          const { data: matchData, error: matchError } = await supabaseClient
            .from('enhanced_matches')
            .upsert({ 
              user1_id: user1, 
              user2_id: user2, 
              status: 'matched' 
            }, { 
              onConflict: 'user1_id,user2_id',
              ignoreDuplicates: false 
            })
            .select('id')
            .single();

          if (matchError) {
            console.error('Match creation error:', matchError);
            throw matchError;
          }

          const matchId = matchData.id;

          // Create or get chat room
          const { data: chatData, error: chatError } = await supabaseClient
            .from('chat_rooms')
            .upsert({
              match_id: matchId,
              user1_id: user1,
              user2_id: user2
            }, {
              onConflict: 'match_id',
              ignoreDuplicates: false
            })
            .select('id')
            .single();

          if (chatError) {
            console.error('Chat room creation error:', chatError);
            throw chatError;
          }

          chatRoomId = chatData.id;

          // Create notifications for both users
          const notifications = [
            {
              user_id: user1,
              type: 'new_match',
              title: 'It\'s a Match! 🎉',
              message: 'You have a new match — say hi!',
              data: { 
                enhanced_match_id: matchId, 
                chat_room_id: chatRoomId, 
                other_user_id: user2 
              }
            },
            {
              user_id: user2,
              type: 'new_match',
              title: 'It\'s a Match! 🎉',
              message: 'You have a new match — say hi!',
              data: { 
                enhanced_match_id: matchId, 
                chat_room_id: chatRoomId, 
                other_user_id: user1 
              }
            }
          ];

          const { error: notifError } = await supabaseClient
            .from('notifications')
            .upsert(notifications, { ignoreDuplicates: true });

          if (notifError) {
            console.error('Notification creation error:', notifError);
            // Don't throw - match still created successfully
          }

          isMatch = true;
          matchResult = { match_id: matchId, chat_room_id: chatRoomId };
          console.log(`🎉 Match created between users ${user_id} and ${target_user_id}`, matchResult);

        } catch (err) {
          console.error('Error in match creation:', err);
          // Fallback: still indicate match detected but may not have completed server setup
          isMatch = true;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        matched: isMatch,
        chatRoomId: chatRoomId,
        message: isMatch ? "It's a match!" : direction === 'right' ? "Like sent!" : "Profile passed"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})