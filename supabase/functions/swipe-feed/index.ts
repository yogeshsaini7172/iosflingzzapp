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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
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
        is_active
      `)
      .eq('is_active', true)
      .not('user_id', 'in', `(${excludedIds.join(',')})`)

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

    // Apply gender filter
    if (filters.gender && filters.gender.length > 0) {
      query = query.in('gender', filters.gender)
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

    // Calculate ages and format response
    const formattedProfiles = (profiles || []).map(profile => ({
      ...profile,
      age: new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
    }))

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