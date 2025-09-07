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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    // For demo purposes, use default user ID if no token
    let userId = "11111111-1111-1111-1111-111111111001"; // Default Alice user
    
    if (token) {
      const { data: user, error: userErr } = await supabase.auth.getUser(token);
      if (user?.user) {
        userId = user.user.id;
      }
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || "20");
    const cursor = url.searchParams.get("cursor") || null;
    const ageMin = Number(url.searchParams.get("age_min") || "18");
    const ageMax = Number(url.searchParams.get("age_max") || "35");
    const gender = url.searchParams.get("gender") || null;

    console.log(`🔍 Fetching feed for user: ${userId}, limit: ${limit}`);

    // Get users already swiped on
    const { data: swipedUsers } = await supabase
      .from("enhanced_swipes")
      .select("target_user_id")
      .eq("user_id", userId);

    // Get blocked users (both directions)
    const { data: blockedUsers } = await supabase
      .from("user_interactions")
      .select("target_user_id")
      .eq("user_id", userId)
      .in("interaction_type", ["ghost", "bench"]);

    // Get matched users
    const { data: matchedUsers } = await supabase
      .from("enhanced_matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    // Build exclusion list
    const excludedIds = [
      userId,
      ...(swipedUsers?.map(s => s.target_user_id) || []),
      ...(blockedUsers?.map(b => b.target_user_id) || []),
      ...(matchedUsers?.map(m => m.user1_id === userId ? m.user2_id : m.user1_id) || [])
    ];

    console.log(`🚫 Excluding ${excludedIds.length} users`);

    // Build query for candidate profiles
    let query = supabase
      .from("candidate_profiles")
      .select("*")
      .not("user_id", "in", `(${excludedIds.join(",")})`)
      .gte("age", ageMin)
      .lte("age", ageMax)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply gender filter if specified
    if (gender && gender !== "all") {
      query = query.eq("gender", gender);
    }

    // Apply cursor-based pagination
    if (cursor) {
      const cursorTime = new Date(cursor).toISOString();
      query = query.lt("created_at", cursorTime);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} candidate profiles`);

    return new Response(
      JSON.stringify({ 
        data: data || [],
        hasMore: (data?.length || 0) >= limit
      }), 
      {
        headers: { 
          ...corsHeaders,
          "content-type": "application/json" 
        },
      }
    );
  } catch (err: any) {
    console.error("❌ Feed error:", err);
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