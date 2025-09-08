import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { 
        status: 405,
        headers: corsHeaders
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.replace("Bearer ", "");
    
    if (!idToken) {
      return new Response(
        JSON.stringify({ error: "No token provided" }), 
        { 
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" }
        }
      );
    }

    // Verify Firebase token
    let firebaseUid;
    try {
      firebaseUid = await verifyFirebaseToken(idToken);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }), 
        { 
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" }
        }
      );
    }
    
    const body = await req.json();
    const { to_user_id, type } = body;

    // Request body already parsed above
    
    if (!to_user_id || !["like", "pass"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload. Expected to_user_id and type (like/pass)" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" }
        }
      );
    }

    console.log(`🎯 Recording ${type} swipe: ${firebaseUid} -> ${to_user_id}`);

    // Insert swipe record
    const { error: swipeError } = await supabase
      .from("enhanced_swipes")
      .insert({
        user_id: firebaseUid,
        target_user_id: to_user_id,
        direction: type === "like" ? "right" : "left"
      });

    if (swipeError) {
      console.error("❌ Swipe insert error:", swipeError);
      throw swipeError;
    }

    let isMatch = false;
    let chatRoomId = null;

    // Check for mutual like if this was a like
    if (type === "like") {
      const { data: reciprocalSwipe } = await supabase
        .from("enhanced_swipes")
        .select("*")
        .eq("user_id", to_user_id)
        .eq("target_user_id", firebaseUid)
        .eq("direction", "right")
        .maybeSingle();

      if (reciprocalSwipe) {
        console.log("🎉 Mutual like detected!");
        
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from("enhanced_matches")
          .select("id, chat_room_id")
          .or(`and(user1_id.eq.${firebaseUid},user2_id.eq.${to_user_id}),and(user1_id.eq.${to_user_id},user2_id.eq.${firebaseUid})`)
          .maybeSingle();

        if (!existingMatch) {
          // Create deterministic ordering for user1/user2 to avoid duplicates
          const user1_id = firebaseUid < to_user_id ? firebaseUid : to_user_id
          const user2_id = firebaseUid < to_user_id ? to_user_id : firebaseUid

          try {
            // 1) Create enhanced match
            const { data: newEnhancedMatch, error: emError } = await supabase
              .from("enhanced_matches")
              .insert({
                user1_id,
                user2_id,
                status: 'matched',
                user1_swiped: true,
                user2_swiped: true,
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (emError) {
              console.error('Failed to insert enhanced_match:', emError);
              throw emError;
            }

            // 2) Create chat room first (corrected ordering)
            const { data: newChatRoom, error: chatError } = await supabase
              .from("chat_rooms")
              .insert({
                match_id: newEnhancedMatch.id,
                user1_id,
                user2_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (chatError) {
              console.error("❌ Chat room creation error:", chatError);
            } else {
              chatRoomId = newChatRoom.id;
              console.log("✅ Match and chat room created!");
            }

            // 3) Get profiles for notifications
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('firebase_uid', firebaseUid)
              .single();

            const { data: targetProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('firebase_uid', to_user_id)
              .single();

            // 4) Insert notifications for both users
            if (targetProfile) {
              const { error: notifErr1 } = await supabase
                .from('notifications')
                .insert({
                  user_id: to_user_id,
                  type: 'new_match',
                  title: 'It\'s a match! 🎉',
                  message: `You and ${currentProfile?.first_name || 'someone'} liked each other!`,
                  data: { 
                    enhanced_match_id: newEnhancedMatch.id, 
                    chat_room_id: chatRoomId,
                    other_user_id: firebaseUid
                  },
                  created_at: new Date().toISOString()
                });

              if (notifErr1) console.error('Notification insert failed for target:', notifErr1);
            }

            if (currentProfile) {
              const { error: notifErr2 } = await supabase
                .from('notifications')
                .insert({
                  user_id: firebaseUid,
                  type: 'new_match',
                  title: 'It\'s a match! 🎉',
                  message: `You and ${targetProfile?.first_name || 'someone'} liked each other!`,
                  data: { 
                    enhanced_match_id: newEnhancedMatch.id, 
                    chat_room_id: chatRoomId,
                    other_user_id: to_user_id
                  },
                  created_at: new Date().toISOString()
                });

              if (notifErr2) console.error('Notification insert failed for current:', notifErr2);
            }

            isMatch = true;

          } catch (err) {
            console.error('Error in match creation flow:', err);
            // Don't throw here, let response continue
          }
        } else {
          isMatch = true;
          chatRoomId = existingMatch.chat_room_id;
          console.log("✅ Match already exists");
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        match: isMatch,
        chat_room_id: chatRoomId
      }), 
      {
        headers: { 
          ...corsHeaders,
          "content-type": "application/json" 
        }
      }
    );

  } catch (err: any) {
    console.error("❌ Swipe error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "server error" }), 
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "content-type": "application/json" 
        }
      }
    );
  }
});