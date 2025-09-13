import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan configuration
const SUBSCRIPTION_PLANS = {
  free: { profiles_shown_count: 1 },
  basic_49: { profiles_shown_count: 10 },
  plus_89: { profiles_shown_count: 10 },
  pro_129: { profiles_shown_count: 10 }
} as const;

interface FeedRequest {
  page?: number;
  limit?: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAIRING-FEED-ENHANCED] ${step}${detailsStr}`);
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
    logStep("Pairing feed request started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');
    
    logStep("User authenticated", { userId: user.id });

    const { page = 1, limit = 20 }: FeedRequest = await req.json();

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

    // Get user's partner preferences for gender filtering
    const { data: userPreferences } = await supabaseClient
      .from('partner_preferences')
      .select('preferred_gender')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get users that have been swiped on
    const { data: swipedUsers } = await supabaseClient
      .from('enhanced_swipes')
      .select('target_user_id')
      .eq('user_id', user.id);

    const swipedUserIds = swipedUsers?.map(s => s.target_user_id) || [];
    
    // Get blocked/ghosted users
    const { data: blockedUsers } = await supabaseClient
      .from('user_interactions')
      .select('target_user_id')
      .eq('user_id', user.id)
      .in('interaction_type', ['block', 'ghost']);

    const blockedUserIds = blockedUsers?.map(b => b.target_user_id) || [];
    
    // Combine exclusion list
    const excludedUserIds = [...swipedUserIds, ...blockedUserIds, user.id];
    
    logStep("Exclusions calculated", { 
      swipedCount: swipedUserIds.length, 
      blockedCount: blockedUserIds.length 
    });

    // Build query for potential matches
    let query = supabaseClient
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
        relationship_goals,
        total_qcs,
        gender,
        priority_score
      `)
      .eq('is_active', true)
      .not('user_id', 'in', `(${excludedUserIds.join(',')})`)
      .order('priority_score', { ascending: false })
      .order('last_active', { ascending: false });

    // GENDER FILTERING: Apply user's preferred gender filter
    if (userPreferences?.preferred_gender?.length > 0) {
      logStep("Applying gender filter", { preferredGender: userPreferences.preferred_gender });
      query = query.in('gender', userPreferences.preferred_gender);
    }

    query = query.limit(limit);

    const { data: candidates, error: candidatesError } = await query;
    
    if (candidatesError) {
      logStep("Candidates query error", { error: candidatesError.message });
      throw candidatesError;
    }

    logStep("Candidates retrieved", { count: candidates?.length || 0 });

    // Format candidates with age calculation
    const formattedCandidates = (candidates || []).map(candidate => ({
      ...candidate,
      age: calculateAge(candidate.date_of_birth),
      profile_images: candidate.profile_images || []
    }));

    // Calculate unlocked vs locked profiles
    const baseUnlocked = plan.profiles_shown_count;
    const extraPairings = profile.extra_pairings_left || 0;
    const totalUnlocked = baseUnlocked + extraPairings;
    
    const unlockedCandidates = formattedCandidates.slice(0, totalUnlocked);
    const lockedCount = Math.max(0, formattedCandidates.length - totalUnlocked);
    
    logStep("Feed calculated", { 
      totalCandidates: formattedCandidates.length,
      unlockedCount: unlockedCandidates.length,
      lockedCount,
      planId,
      extraPairings 
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        unlocked: unlockedCandidates,
        locked_count: lockedCount,
        plan_info: {
          id: planId,
          base_profiles_shown: baseUnlocked,
          extra_pairings_left: extraPairings,
          total_unlocked: totalUnlocked
        },
        pagination: {
          page,
          limit,
          total: formattedCandidates.length
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