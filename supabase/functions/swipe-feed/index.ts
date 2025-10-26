import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FeedRequest {
  user_id: string;
  limit?: number;
  filters?: {
    ageMin?: number;
    ageMax?: number;
    heightMin?: number;
    heightMax?: number;
    gender?: string[];
  };
}

// Haversine formula to calculate distance between two coordinates (in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

    const { user_id, limit = 10, filters = {} }: FeedRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get current user's location preferences and gender
    const { data: currentUser } = await supabaseClient
      .from('profiles')
      .select('latitude, longitude, state, match_radius_km, match_by_state, gender')
      .eq('user_id', user_id)
      .single();

    const userLat = currentUser?.latitude;
    const userLon = currentUser?.longitude;
    const userState = currentUser?.state;
    const matchRadius = currentUser?.match_radius_km || 50;
    const matchByState = currentUser?.match_by_state || false;

    console.log(`📍 User location settings: state=${userState}, radius=${matchRadius}km, stateOnly=${matchByState}`);

    // Get user's gender and preferred gender from partner_preferences
    const userGender = currentUser?.gender?.toLowerCase().trim();
    const { data: userPreferences } = await supabaseClient
      .from('partner_preferences')
      .select('preferred_gender')
      .eq('user_id', user_id)
      .maybeSingle();

    // Get already swiped users
    const { data: swipedUsers, error: swipeError } = await supabaseClient
      .from('enhanced_swipes')
      .select('target_user_id')
      .eq('user_id', user_id)

    if (swipeError) {
      console.error('Error fetching swiped users:', swipeError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user swipes' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get blocked/ghosted users (exclude from feed)
    const { data: blockedUsers, error: blockError } = await supabaseClient
      .from('user_interactions')
      .select('target_user_id, interaction_type, expires_at')
      .eq('user_id', user_id)
      .in('interaction_type', ['ghost', 'bench'])

    const activeBlockedUsers = (blockedUsers || []).filter(user => {
      if (user.interaction_type === 'bench') {
        return true; // Bench is permanent
      }
      if (user.interaction_type === 'ghost' && user.expires_at) {
        return new Date(user.expires_at) > new Date(); // Ghost is active if not expired
      }
      return false;
    }).map(user => user.target_user_id)

    if (blockError) {
      console.error('Error fetching blocked users:', blockError)
    }

    // Build exclusion list
    const excludedIds = [
      user_id,
      ...(swipedUsers?.map(s => s.target_user_id) || []),
      ...activeBlockedUsers
    ]

    // Build query with filters
    let query = supabaseClient
      .from('profiles')
      .select(`
        user_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        bio,
        profile_images,
        university,
        interests,
        relationship_goals,
        height,
        personality_type,
        values,
        mindset,
        major,
        year_of_study,
        is_active,
        show_profile,
        latitude,
        longitude,
        state
      `)
      .eq('is_active', true)
      .eq('show_profile', true)
      .not('user_id', 'in', `(${excludedIds.join(',')})`)

    // STATE-BASED FILTERING: If user enabled state-only matching
    if (matchByState && userState) {
      console.log(`🗺️ State filter: showing only ${userState}`);
      query = query.eq('state', userState);
    }

    // Apply age filters
    if (filters.ageMin || filters.ageMax) {
      const currentYear = new Date().getFullYear()
      if (filters.ageMax) {
        query = query.gte('date_of_birth', new Date(currentYear - filters.ageMax, 0, 1).toISOString())
      }
      if (filters.ageMin) {
        query = query.lte('date_of_birth', new Date(currentYear - filters.ageMin, 11, 31).toISOString())
      }
    }

    // Apply height filters
    if (filters.heightMin) {
      query = query.gte('height', filters.heightMin)
    }
    if (filters.heightMax) {
      query = query.lte('height', filters.heightMax)
    }

    // GENDER FILTERING: Automatic opposite gender matching
    let targetGenders: string[] = [];
    
    // Default: Show opposite gender based on user's gender
    if (userGender === 'male') {
      targetGenders = ['female'];
      console.log('👨 Male user → Showing only Female profiles');
    } else if (userGender === 'female') {
      targetGenders = ['male'];
      console.log('👩 Female user → Showing only Male profiles');
    } else {
      // For non-binary or other genders, use preferences
      const preferredGenders = userPreferences?.preferred_gender || filters.gender;
      if (preferredGenders && preferredGenders.length > 0) {
        const hasAllOrAny = preferredGenders.some((g: any) => {
          const normalized = typeof g === 'string' ? g.toLowerCase().trim() : '';
          return normalized === 'all' || normalized === 'any';
        });
        
        if (!hasAllOrAny) {
          targetGenders = preferredGenders
            .map((g: any) => (typeof g === 'string' ? g.toLowerCase().trim() : ''))
            .filter((g: string) => g === 'male' || g === 'female');
        }
      }
      console.log('🌈 Non-binary/Other gender → Using preferences:', targetGenders);
    }
    
    // Override with explicit user preferences if they set them
    const preferredGenders = userPreferences?.preferred_gender;
    if (preferredGenders && preferredGenders.length > 0 && (userGender === 'male' || userGender === 'female')) {
      const hasAllOrAny = preferredGenders.some((g: any) => {
        const normalized = typeof g === 'string' ? g.toLowerCase().trim() : '';
        return normalized === 'all' || normalized === 'any';
      });
      
      if (!hasAllOrAny) {
        const normalizedGenders = preferredGenders
          .map((g: any) => (typeof g === 'string' ? g.toLowerCase().trim() : ''))
          .filter((g: string) => g === 'male' || g === 'female');
        
        if (normalizedGenders.length > 0) {
          targetGenders = normalizedGenders;
          console.log('⚙️ Using user preference override:', targetGenders);
        }
      } else {
        targetGenders = []; // Show all genders
        console.log('🚻 "All"/"Any" selected - showing all genders');
      }
    }
    
    // Apply gender filter
    if (targetGenders.length > 0) {
      query = query.in('gender', targetGenders);
      console.log('✅ Gender filter applied:', targetGenders);
    } else {
      console.log('⚠️ No gender filter - showing all genders');
    }

    query = query.limit(limit)

    const { data: profiles, error: profileError } = await query

    if (profileError) {
      console.error('Error fetching profiles:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // DISTANCE FILTERING: Filter by radius if not using state-based matching and user has location
    let filteredProfiles = profiles || [];
    if (!matchByState && userLat && userLon) {
      filteredProfiles = filteredProfiles.filter(profile => {
        if (!profile.latitude || !profile.longitude) return false;
        const distance = calculateDistance(userLat, userLon, profile.latitude, profile.longitude);
        return distance <= matchRadius;
      });
      console.log(`📏 Distance filter: ${filteredProfiles.length}/${profiles?.length || 0} within ${matchRadius}km`);
    }

    // Calculate ages and format response
    const formattedProfiles = filteredProfiles.map(profile => {
      const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear();
      let distance = null;
      
      // Calculate distance for display
      if (userLat && userLon && profile.latitude && profile.longitude) {
        distance = Math.round(calculateDistance(userLat, userLon, profile.latitude, profile.longitude));
      }

      return {
        ...profile,
        age,
        distance
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        profiles: formattedProfiles,
        count: formattedProfiles.length
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