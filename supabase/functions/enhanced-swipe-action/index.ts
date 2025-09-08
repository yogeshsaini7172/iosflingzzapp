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
        // Create deterministic ordering for user1/user2 to avoid duplicates
        const user1_id = user_id < target_user_id ? user_id : target_user_id
        const user2_id = user_id < target_user_id ? target_user_id : user_id

        try {
          // 1) Insert into enhanced_matches with conflict resolution
          const { data: newEnhancedMatch, error: emError } = await supabaseClient
            .from('enhanced_matches')
            .upsert({
              user1_id,
              user2_id,
              status: 'matched',
              user1_swiped: true,
              user2_swiped: true,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'user1_id,user2_id'
            })
            .select()
            .single()

          if (emError) {
            console.error('Failed to upsert enhanced_match:', emError)
            throw emError
          }

          const matchId = newEnhancedMatch.id
          isMatch = true

          // 2) Create a chat room linked to this match (idempotent)
          const { data: existingChatRoom } = await supabaseClient
            .from('chat_rooms')
            .select('id')
            .eq('match_id', matchId)
            .maybeSingle()

          let chatRoomId = existingChatRoom?.id

          if (!existingChatRoom) {
            const { data: chatRoom, error: chatRoomErr } = await supabaseClient
              .from('chat_rooms')
              .insert({
                match_id: matchId,
                user1_id,
                user2_id,
                created_at: new Date().toISOString()
              })
              .select()
              .single()

            if (chatRoomErr) {
              console.error('Chat room creation failed:', chatRoomErr)
            } else {
              chatRoomId = chatRoom.id
            }
          }

          // 3) Insert notifications for both users (idempotent check)
          const { data: targetProfile } = await supabaseClient
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', target_user_id)
            .maybeSingle()

          const { data: currentProfile } = await supabaseClient
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', user_id)
            .maybeSingle()

          // Check if notifications already exist before creating
          const { data: existingNotifTarget } = await supabaseClient
            .from('notifications')
            .select('id')
            .eq('user_id', target_user_id)
            .eq('type', 'new_match')
            .eq('data->>enhanced_match_id', matchId)
            .maybeSingle()

          const { data: existingNotifCurrent } = await supabaseClient
            .from('notifications')
            .select('id')
            .eq('user_id', user_id)
            .eq('type', 'new_match')
            .eq('data->>enhanced_match_id', matchId)
            .maybeSingle()

          // Notify target user (if not already notified)
          if (targetProfile && !existingNotifTarget) {
            const { error: notifErr1 } = await supabaseClient
              .from('notifications')
              .insert({
                user_id: target_user_id,
                type: 'new_match',
                title: 'It\'s a match! 🎉',
                message: `You and ${currentProfile?.first_name || 'someone'} liked each other!`,
                data: { 
                  enhanced_match_id: matchId, 
                  chat_room_id: chatRoomId || null,
                  other_user_id: user_id
                },
                created_at: new Date().toISOString()
              })

            if (notifErr1) console.error('Notification insert failed for target:', notifErr1)
          }

          // Notify current user (if not already notified)
          if (currentProfile && !existingNotifCurrent) {
            const { error: notifErr2 } = await supabaseClient
              .from('notifications')
              .insert({
                user_id: user_id,
                type: 'new_match',
                title: 'It\'s a match! 🎉',
                message: `You and ${targetProfile?.first_name || 'someone'} liked each other!`,
                data: { 
                  enhanced_match_id: matchId, 
                  chat_room_id: chatRoomId || null,
                  other_user_id: target_user_id
                },
                created_at: new Date().toISOString()
              })

            if (notifErr2) console.error('Notification insert failed for current:', notifErr2)
          }

          console.log(`🎉 Match processed between users ${user_id} and ${target_user_id}, chat room: ${chatRoomId}`)

        } catch (err) {
          console.error('Error in match creation flow:', err)
          // Don't throw here, let the response continue with isMatch = false
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