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
        // Create match record
        const user1_id = user_id < target_user_id ? user_id : target_user_id
        const user2_id = user_id < target_user_id ? target_user_id : user_id

        const { data: match, error: createMatchError } = await supabaseClient
          .from('enhanced_matches')
          .insert({
            user1_id,
            user2_id,
            status: 'matched',
            user1_swiped: true,
            user2_swiped: true
          })
          .select()
          .single()

        if (createMatchError) {
          console.error('Error creating match:', createMatchError)
        } else {
          // Create chat room
          const { data: chatRoom, error: chatError } = await supabaseClient
            .from('chat_rooms')
            .insert({
              match_id: match.id,
              user1_id: match.user1_id,
              user2_id: match.user2_id
            })
            .select()
            .single()

          if (chatError) {
            console.error('Error creating chat room:', chatError)
          } else {
            isMatch = true
            chatRoomId = chatRoom.id

            // Get target user profile for notification
            const { data: targetProfile } = await supabaseClient
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', target_user_id)
              .single()

            console.log(`🎉 Match created between users ${user_id} and ${target_user_id}`)
          }
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