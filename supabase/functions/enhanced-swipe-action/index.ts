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
        // Use the stored procedure for atomic match creation
        try {
          const { data, error: rpcError } = await supabaseClient.rpc('create_match_and_chat', {
            p_actor_id: user_id,
            p_a: user_id,
            p_b: target_user_id
          })

          if (rpcError) {
            console.error('RPC error:', rpcError)
            throw rpcError
          }

          if (data) {
            matchResult = data
            isMatch = true
            chatRoomId = data.chat_room_id
            console.log(`🎉 Match created atomically between users ${user_id} and ${target_user_id}`, data)
          }

        } catch (err) {
          console.error('Error in atomic match creation:', err)
          // Fallback: still indicate match detected but may not have completed server setup
          isMatch = true
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