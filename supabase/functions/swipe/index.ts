import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const token = authHeader.replace("Bearer ", "");
    
    // Get user ID from request body (Firebase Auth) or token (Supabase Auth)
    const body = await req.json();
    const { to_user_id, type, from_user_id } = body;
    
    let userId = from_user_id; // Prefer explicit user ID from Firebase
    
    if (!userId && token) {
      const { data: user, error: userErr } = await supabase.auth.getUser(token);
      if (user?.user) {
        userId = user.user.id;
      }
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User authentication required" }), 
        { 
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" }
        }
      );
    }

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

    console.log(`🎯 Recording ${type} swipe: ${userId} -> ${to_user_id}`);

    // Insert swipe record
    const { error: swipeError } = await supabase
      .from("enhanced_swipes")
      .insert({
        user_id: userId,
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
        .eq("target_user_id", userId)
        .eq("direction", "right")
        .maybeSingle();

      if (reciprocalSwipe) {
        console.log("🎉 Mutual like detected!");
        
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from("enhanced_matches")
          .select("id, chat_room_id")
          .or(`and(user1_id.eq.${userId},user2_id.eq.${to_user_id}),and(user1_id.eq.${to_user_id},user2_id.eq.${userId})`)
          .maybeSingle();

        if (!existingMatch) {
          // Create chat room first
          const { data: newChatRoom, error: chatError } = await supabase
            .from("chat_rooms")
            .insert({
              user1_id: userId,
              user2_id: to_user_id
            })
            .select()
            .single();

          if (chatError) {
            console.error("❌ Chat room creation error:", chatError);
          } else {
            chatRoomId = newChatRoom.id;
            
            // Create match with chat room reference
            const { error: matchError } = await supabase
              .from("enhanced_matches")
              .insert({
                user1_id: userId,
                user2_id: to_user_id,
                chat_room_id: chatRoomId,
                status: "pending"
              });

            if (matchError) {
              console.error("❌ Match creation error:", matchError);
            } else {
              isMatch = true;
              console.log("✅ Match and chat room created!");
            }
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