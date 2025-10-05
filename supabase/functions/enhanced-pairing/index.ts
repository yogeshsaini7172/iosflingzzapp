import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Firebase ID token
async function verifyFirebaseToken(idToken: string) {
  try {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Invalid token format')
    }

    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      throw new Error('Firebase service account not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    
    // Split and validate token structure
    const tokenParts = idToken.split('.')
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT structure')
    }
    
    // Use base64url-safe decoding for JWT payload
    const base64UrlPayload = tokenParts[1]
    if (!base64UrlPayload) {
      throw new Error('Missing token payload')
    }
    
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

function parseJSON(jsonString: any, fallback: any = {}): any {
  try {
    return jsonString ? JSON.parse(jsonString as string) : fallback;
  } catch (e) {
    console.warn("Could not parse JSON:", e);
    return fallback;
  }
}

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

function hasAnyOrAll(arr: any[]): boolean {
  if (!Array.isArray(arr)) return false;
  return arr.some(item => {
    const normalized = typeof item === 'string' ? item.toLowerCase().trim() : '';
    return normalized === 'any' || normalized === 'all';
  });
}

function calculateCompatibility(userProfile: any, candidateProfile: any): any {
  const userQualities = parseJSON(userProfile.qualities);
  const userRequirements = parseJSON(userProfile.requirements);
  const candidateQualities = parseJSON(candidateProfile.qualities);
  const candidateRequirements = parseJSON(candidateProfile.requirements);

  let physicalScore = 0;
  let maxPhysicalScore = 0;
  let mentalScore = 0;
  let maxMentalScore = 0;

  // Physical compatibility
  // Height compatibility
  maxPhysicalScore += 20;
  if (userProfile.height && candidateProfile.height) {
    const userHeight = userProfile.height;
    const candidateHeight = candidateProfile.height;
    
    // Check if candidate meets user's height requirements
    const userHeightMin = userRequirements.height_range_min || 150;
    const userHeightMax = userRequirements.height_range_max || 200;
    if (candidateHeight >= userHeightMin && candidateHeight <= userHeightMax) {
      physicalScore += 10;
    }
    
    // Check if user meets candidate's height requirements
    const candidateHeightMin = candidateRequirements.height_range_min || 150;
    const candidateHeightMax = candidateRequirements.height_range_max || 200;
    if (userHeight >= candidateHeightMin && userHeight <= candidateHeightMax) {
      physicalScore += 10;
    }
  }

  // Age compatibility
  maxPhysicalScore += 20;
  if (userProfile.date_of_birth && candidateProfile.date_of_birth) {
    const userAge = calculateAge(userProfile.date_of_birth);
    const candidateAge = calculateAge(candidateProfile.date_of_birth);
    
    const userAgeMin = userRequirements.age_range_min || 18;
    const userAgeMax = userRequirements.age_range_max || 30;
    const candidateAgeMin = candidateRequirements.age_range_min || 18;
    const candidateAgeMax = candidateRequirements.age_range_max || 30;
    
    if (candidateAge >= userAgeMin && candidateAge <= userAgeMax) physicalScore += 10;
    if (userAge >= candidateAgeMin && userAge <= candidateAgeMax) physicalScore += 10;
  }

  // Mental compatibility
  // Shared interests
  maxMentalScore += 40;
  const userInterests = userQualities.interests || [];
  const candidateInterests = candidateQualities.interests || [];
  const sharedInterests = userInterests.filter((interest: string) => candidateInterests.includes(interest));
  mentalScore += Math.min(sharedInterests.length * 8, 40);

  // Relationship goals compatibility
  maxMentalScore += 30;
  const userGoals = userQualities.relationship_goals || [];
  const candidateGoals = candidateQualities.relationship_goals || [];
  const sharedGoals = userGoals.filter((goal: string) => candidateGoals.includes(goal));
  if (sharedGoals.length > 0) {
    mentalScore += 30;
  }

  // Values compatibility
  maxMentalScore += 30;
  const userValues = userQualities.values || [];
  const candidateValues = candidateQualities.values || [];
  const sharedValues = userValues.filter((value: string) => candidateValues.includes(value));
  mentalScore += Math.min(sharedValues.length * 10, 30);

  const finalPhysicalScore = maxPhysicalScore > 0 ? Math.round((physicalScore / maxPhysicalScore) * 100) : 0;
  const finalMentalScore = maxMentalScore > 0 ? Math.round((mentalScore / maxMentalScore) * 100) : 0;
  const overallScore = Math.round((finalMentalScore * 0.6) + (finalPhysicalScore * 0.4));

  return {
    physical_score: finalPhysicalScore,
    mental_score: finalMentalScore,
    overall_score: overallScore,
    shared_interests: sharedInterests,
    compatibility_reasons: generateCompatibilityReasons(userQualities, candidateQualities, sharedInterests, sharedGoals, sharedValues)
  };
}

function generateCompatibilityReasons(userQualities: any, candidateQualities: any, sharedInterests: string[], sharedGoals: string[], sharedValues: string[]): string[] {
  const reasons: string[] = [];

  if (sharedInterests.length > 0) {
    if (sharedInterests.length === 1) {
      reasons.push(`You both love ${sharedInterests[0]}`);
    } else {
      reasons.push(`You share ${sharedInterests.length} interests including ${sharedInterests.slice(0, 2).join(', ')}`);
    }
  }

  if (sharedValues.length > 0) {
    reasons.push(`You both value ${sharedValues[0].toLowerCase()}`);
  }

  if (sharedGoals.length > 0) {
    reasons.push(`You're both looking for ${sharedGoals[0].toLowerCase()}`);
  }

  return reasons.slice(0, 3);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify Firebase token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No valid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const idToken = authHeader.replace('Bearer ', '').trim()
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

    const { limit = 10 } = await req.json().catch(() => ({}));

    console.log(`[ENHANCED-PAIRING] Fetching compatible profiles for user: ${firebaseUid}`);

    // Get user's profile and QCS range
    const { data: userProfile, error: userError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !userProfile) {
      console.error('User profile not found:', userError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User profile not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userQCS = userProfile.total_qcs || 0;
    const qcsRange = 15; // ±15 points range
    const minQCS = Math.max(0, userQCS - qcsRange);
    const maxQCS = Math.min(100, userQCS + qcsRange);

    console.log(`USER QCS: ${userQCS}, Range: [${minQCS}, ${maxQCS}]`);

    // Get user's partner preferences for gender filtering
    const { data: userPreferences } = await supabaseClient
      .from('partner_preferences')
      .select('preferred_gender')
      .eq('user_id', firebaseUid)
      .maybeSingle();

    // Get potential matches excluding already swiped users
    const { data: swipedUsers } = await supabaseClient
      .from('enhanced_swipes')
      .select('target_user_id')
      .eq('user_id', firebaseUid);

    const swipedUserIds = swipedUsers?.map(s => s.target_user_id) || [];

    let query = supabaseClient
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .eq('show_profile', true)
      .neq('firebase_uid', firebaseUid)
      .gte('total_qcs', minQCS)
      .lte('total_qcs', maxQCS);

    // GENDER FILTERING: Apply user's preferred gender filter
    if (userPreferences?.preferred_gender?.length > 0) {
      // Check if "All" or "Any" is selected - if so, skip gender filter entirely
      const hasAllOrAny = userPreferences.preferred_gender.some((g: string) => {
        const normalized = typeof g === 'string' ? g.toLowerCase().trim() : '';
        return normalized === 'all' || normalized === 'any';
      });
      
      if (!hasAllOrAny) {
        // Only apply filter if specific genders are selected (not "All"/"Any")
        const normalizedGenders = userPreferences.preferred_gender
          .map((g: string) => (typeof g === 'string' ? g.toLowerCase().trim() : ''))
          .filter((g: string) => g === 'male' || g === 'female');
        console.log('Applying gender filter:', normalizedGenders);
        if (normalizedGenders.length > 0) {
          query = query.in('gender', normalizedGenders);
        }
      } else {
        console.log('"All"/"Any" selected - showing all genders');
      }
    }

    // Exclude swiped users
    if (swipedUserIds.length > 0) {
      query = query.not('firebase_uid', 'in', `(${swipedUserIds.join(',')})`);
    }

    const { data: candidates, error: candidatesError } = await query.limit(limit * 2);

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Error fetching candidates' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!candidates || candidates.length === 0) {
      console.log('No candidates found in QCS range');
      return new Response(JSON.stringify({
        success: true,
        data: { profiles: [] },
        message: 'No compatible profiles found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${candidates.length} candidates in QCS range`);

    // Calculate compatibility scores for all candidates
    const candidatesWithScores = candidates.map(candidate => {
      const compatibility = calculateCompatibility(userProfile, candidate);
      return {
        ...candidate,
        compatibility_score: compatibility.overall_score,
        physical_compatibility: compatibility.physical_score,
        mental_compatibility: compatibility.mental_score,
        shared_interests: compatibility.shared_interests,
        compatibility_reasons: compatibility.compatibility_reasons
      };
    });

    // Sort by compatibility score and QCS proximity
    const sortedCandidates = candidatesWithScores
      .filter(candidate => candidate.compatibility_score > 40) // Minimum compatibility threshold
      .sort((a, b) => {
        // Primary sort: compatibility score
        const compatibilityDiff = b.compatibility_score - a.compatibility_score;
        if (Math.abs(compatibilityDiff) > 5) return compatibilityDiff;
        
        // Secondary sort: QCS proximity (closer QCS scores are better)
        const qcsProximityA = Math.abs(a.total_qcs - userQCS);
        const qcsProximityB = Math.abs(b.total_qcs - userQCS);
        return qcsProximityA - qcsProximityB;
      })
      .slice(0, limit);

    console.log(`Returning top ${sortedCandidates.length} compatible profiles`);

    return new Response(JSON.stringify({
      success: true,
      data: { 
        profiles: sortedCandidates,
        user_qcs: userQCS,
        qcs_range: [minQCS, maxQCS]
      },
      message: `Found ${sortedCandidates.length} compatible profiles`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ENHANCED-PAIRING] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});