import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Firebase JWT validation
async function validateFirebaseToken(token: string) {
  try {
    // Decode the Firebase JWT token
    const [header, payload] = token.split('.').slice(0, 2);
    const decodedPayload = JSON.parse(atob(payload));
    
    // Basic validation - check if token has required fields
    if (!decodedPayload.user_id || !decodedPayload.email) {
      throw new Error('Invalid token structure');
    }
    
    return {
      user: {
        id: decodedPayload.user_id,
        email: decodedPayload.email,
        aud: decodedPayload.aud
      }
    };
  } catch (error) {
    throw new Error(`Token validation failed: ${error.message}`);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan configuration
const SUBSCRIPTION_PLANS = {
  free: { can_see_who_liked_you: false },
  basic_49: { can_see_who_liked_you: true },
  plus_89: { can_see_who_liked_you: true },
  pro_129: { can_see_who_liked_you: true }
} as const;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WHO-LIKED-ME] ${step}${detailsStr}`);
};

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Who liked me request started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { user } = await validateFirebaseToken(token);
    if (!user) throw new Error('User not authenticated');
    
    logStep("User authenticated", { userId: user.id });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    const planId = profile.plan_id || 'free';
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
    
    logStep("Profile retrieved", { planId, userId: user.id });

    // Check if plan allows seeing who liked you
    if (!plan.can_see_who_liked_you) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Upgrade to see who liked you',
        plan_info: {
          id: planId,
          can_see_who_liked_you: false,
          upgrade_required: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Get users who liked this user (swiped right on them)
    const { data: likerSwipes, error: swipesError } = await supabaseClient
      .from('enhanced_swipes')
      .select(`
        user_id,
        created_at
      `)
      .eq('target_user_id', user.id)
      .eq('direction', 'right')
      .order('created_at', { ascending: false });

    if (swipesError) {
      logStep("Swipes query error", { error: swipesError.message });
      throw swipesError;
    }

    logStep("Likers retrieved", { count: likerSwipes?.length || 0 });

    // Get profiles for the likers
    const likerIds = (likerSwipes || []).map(swipe => swipe.user_id);
    
    if (likerIds.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          count: 0,
          mutual_matches_count: 0,
          users: [],
          plan_info: {
            id: planId,
            can_see_who_liked_you: true
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select(`
        user_id,
        first_name,
        last_name,
        date_of_birth,
        university,
        profile_images,
        bio,
        interests,
        total_qcs,
        gender
      `)
      .in('user_id', likerIds);

    if (profilesError) {
      logStep("Profiles query error", { error: profilesError.message });
      throw profilesError;
    }

    // Create a map of user_id to profile for easy lookup
    const profileMap = new Map();
    (profiles || []).forEach(profile => {
      profileMap.set(profile.user_id, profile);
    });

    // Create a map of user_id to swipe time
    const swipeTimeMap = new Map();
    (likerSwipes || []).forEach(swipe => {
      swipeTimeMap.set(swipe.user_id, swipe.created_at);
    });

    // Format the likers data by combining swipes and profiles
    const likers = (likerSwipes || [])
      .map(swipe => {
        const profile = profileMap.get(swipe.user_id);
        if (!profile) return null; // Skip if no profile found
        
        return {
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          age: calculateAge(profile.date_of_birth),
          university: profile.university,
          profile_images: profile.profile_images || [],
          bio: profile.bio,
          interests: profile.interests || [],
          total_qcs: profile.total_qcs || 0,
          gender: profile.gender,
          liked_at: swipe.created_at
        };
      })
      .filter(Boolean); // Remove null entries

    // Check for existing mutual matches (if there are any likers)
    let mutualMatches = [];
    if (likers.length > 0) {
      const { data } = await supabaseClient
        .from('enhanced_matches')
        .select('user1_id, user2_id')
        .or(`and(user1_id.eq.${user.id},user2_id.in.(${likers.map(l => l.user_id).join(',')})),and(user2_id.eq.${user.id},user1_id.in.(${likers.map(l => l.user_id).join(',')}))`);
      
      mutualMatches = data || [];
    }

    const matchedUserIds = new Set(
      (mutualMatches || []).map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      )
    );

    // Add match status to likers
    const likersWithMatchStatus = likers.map(liker => ({
      ...liker,
      is_mutual_match: matchedUserIds.has(liker.user_id)
    }));

    logStep("Likers processed", { 
      totalLikers: likers.length,
      mutualMatches: matchedUserIds.size 
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        count: likers.length,
        mutual_matches_count: matchedUserIds.size,
        users: likersWithMatchStatus,
        plan_info: {
          id: planId,
          can_see_who_liked_you: true
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});