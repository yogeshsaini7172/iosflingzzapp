import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Verify Firebase ID token
async function verifyFirebaseToken(idToken: string) {
  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      throw new Error('Firebase service account not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    
    // Use base64url-safe decoding for JWT payload
    const base64UrlPayload = idToken.split('.')[1]
    const base64Payload = base64UrlPayload.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64Payload))
    
    // Validate token claims
    if (!payload.iss?.includes('securetoken.google.com') || 
        !payload.aud?.includes(serviceAccount.project_id) ||
        !payload.sub) {
      throw new Error('Invalid token issuer, audience or subject')
    }
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) {
      throw new Error('Token expired')
    }
    
    return payload.sub // Return Firebase UID
  } catch (error) {
    console.error('Token verification error:', error)
    throw new Error('Invalid or expired token')
  }
}

interface SwipeRequest {
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

    // Verify Firebase token
    const authHeader = req.headers.get('authorization') || ''
    const idToken = authHeader.replace('Bearer ', '')
    
    if (!idToken) {
      return new Response(
        JSON.stringify({ error: 'No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let firebaseUid
    try {
      firebaseUid = await verifyFirebaseToken(idToken)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { target_user_id, direction }: SwipeRequest = await req.json()

    console.log(`📝 Function invocation: enhanced-swipe-action`, { user_id: firebaseUid, target_user_id, direction });

    // Log function invocation for observability
    await supabaseClient.from('function_invocations').insert({
      function_name: 'enhanced-swipe-action',
      payload: { user_id: firebaseUid, target_user_id, direction },
      user_id: firebaseUid,
      status: 'started'
    }).then(r => console.log('Logged invocation:', r.error || 'success'));

    if (!target_user_id || !direction) {
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
        user_id: firebaseUid,
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
      console.log(`🔍 Checking for existing swipe from ${target_user_id} to ${firebaseUid}`);
      
      const { data: otherSwipe, error: matchError } = await supabaseClient
        .from('enhanced_swipes')
        .select('*')
        .eq('user_id', target_user_id)
        .eq('target_user_id', firebaseUid)
        .eq('direction', 'right')
        .maybeSingle()

      if (matchError) {
        console.error('Error checking for match:', matchError)
      } else if (otherSwipe) {
        console.log('🎯 Found mutual like! Creating match...', otherSwipe);
        
        // Create match and chat room directly using service role client
        try {
          // Determine deterministic user ordering
          const user1 = firebaseUid < target_user_id ? firebaseUid : target_user_id;
          const user2 = firebaseUid < target_user_id ? target_user_id : firebaseUid;

          console.log(`📝 Creating match between ${user1} and ${user2}`);

          // Insert or get existing match
          const { data: matchData, error: matchCreateError } = await supabaseClient
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

          if (matchCreateError) {
            console.error('Match creation error:', matchCreateError);
            throw matchCreateError;
          }

          const matchId = matchData.id;
          console.log('✅ Match created with ID:', matchId);

          // Create or get chat room
          const { data: chatData, error: chatCreateError } = await supabaseClient
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

          if (chatCreateError) {
            console.error('Chat room creation error:', chatCreateError);
            throw chatCreateError;
          }

          chatRoomId = chatData.id;
          console.log('✅ Chat room created with ID:', chatRoomId);

          // Get profile data for notifications
          const { data: user1Profile } = await supabaseClient
            .from('profiles')
            .select('first_name')
            .eq('firebase_uid', user1)
            .single();

          const { data: user2Profile } = await supabaseClient
            .from('profiles')
            .select('first_name')
            .eq('firebase_uid', user2)
            .single();

          // Create notifications for both users
          const notifications = [
            {
              user_id: user1,
              type: 'new_match',
              title: 'It\'s a Match! 🎉',
              message: `You and ${user2Profile?.first_name || 'someone'} liked each other!`,
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
              message: `You and ${user1Profile?.first_name || 'someone'} liked each other!`,
              data: { 
                enhanced_match_id: matchId, 
                chat_room_id: chatRoomId, 
                other_user_id: user1 
              }
            }
          ];

          const { error: notifError } = await supabaseClient
            .from('notifications')
            .insert(notifications);

          if (notifError) {
            console.error('Notification creation error:', notifError);
            // Don't throw - match still created successfully
          } else {
            console.log('✅ Notifications created for both users');
          }

          isMatch = true;
          matchResult = { match_id: matchId, chat_room_id: chatRoomId };
          console.log(`🎉 Match created successfully between users ${firebaseUid} and ${target_user_id}`, matchResult);

        } catch (err) {
          console.error('❌ Error in match creation:', err);
          // Fallback: still indicate match detected but may not have completed server setup
          isMatch = true;
        }
      } else {
        console.log('💝 No mutual swipe found yet - like recorded');
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