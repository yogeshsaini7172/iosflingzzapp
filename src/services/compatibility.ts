import { supabase } from "@/integrations/supabase/client";

export interface CompatibilityScore {
  physical_score: number;
  mental_score: number;
  overall_score: number;
  shared_interests: string[];
  compatibility_reasons: string[];
}

export async function calculateCompatibility(userId1: string, userId2: string): Promise<CompatibilityScore> {
  try {
    // Fetch both profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", [userId1, userId2]);

    if (error || !profiles || profiles.length !== 2) {
      console.error("Error fetching profiles for compatibility:", error);
      return {
        physical_score: 63,
        mental_score: 75,
        overall_score: 50,
        shared_interests: [],
        compatibility_reasons: []
      };
    }

    const [profile1, profile2] = profiles;

    // Parse qualities and requirements (same as enhanced-pairing)
    const qualities1 = parseJSON(profile1.qualities) || {};
    const requirements1 = parseJSON(profile1.requirements) || {};
    const qualities2 = parseJSON(profile2.qualities) || {};
    const requirements2 = parseJSON(profile2.requirements) || {};

    // If no qualities/requirements data exists, return fallback scores
    const hasData1 = Object.keys(qualities1).length > 0 || Object.keys(requirements1).length > 0;
    const hasData2 = Object.keys(qualities2).length > 0 || Object.keys(requirements2).length > 0;

    if (!hasData1 || !hasData2) {
      return {
        physical_score: 63,
        mental_score: 75,
        overall_score: 50,
        shared_interests: [],
        compatibility_reasons: []
      };
    }

    // Calculate compatibility using the same logic as enhanced-pairing
    let physicalScore = 0;
    let maxPhysicalScore = 0;
    let mentalScore = 0;
    let maxMentalScore = 0;

    // Physical compatibility
    // Height compatibility
    maxPhysicalScore += 20;
    if (profile1.height && profile2.height) {
      const userHeight = profile1.height;
      const candidateHeight = profile2.height;

      // Check if candidate meets user's height requirements
      const userHeightMin = requirements1.height_range_min || 150;
      const userHeightMax = requirements1.height_range_max || 200;
      if (candidateHeight >= userHeightMin && candidateHeight <= userHeightMax) {
        physicalScore += 10;
      }

      // Check if user meets candidate's height requirements
      const candidateHeightMin = requirements2.height_range_min || 150;
      const candidateHeightMax = requirements2.height_range_max || 200;
      if (userHeight >= candidateHeightMin && userHeight <= candidateHeightMax) {
        physicalScore += 10;
      }
    }

    // Age compatibility
    maxPhysicalScore += 20;
    if (profile1.date_of_birth && profile2.date_of_birth) {
      const userAge = calculateAge(profile1.date_of_birth);
      const candidateAge = calculateAge(profile2.date_of_birth);

      const userAgeMin = requirements1.age_range_min || 18;
      const userAgeMax = requirements1.age_range_max || 30;
      const candidateAgeMin = requirements2.age_range_min || 18;
      const candidateAgeMax = requirements2.age_range_max || 30;

      if (candidateAge >= userAgeMin && candidateAge <= userAgeMax) physicalScore += 10;
      if (userAge >= candidateAgeMin && userAge <= candidateAgeMax) physicalScore += 10;
    }

    // Mental compatibility
    // Shared interests
    maxMentalScore += 40;
    const userInterests = qualities1.interests || [];
    const candidateInterests = qualities2.interests || [];
    const sharedInterests = userInterests.filter((interest: string) => candidateInterests.includes(interest));
    mentalScore += Math.min(sharedInterests.length * 8, 40);

    // Relationship goals compatibility
    maxMentalScore += 30;
    const userGoals = qualities1.relationship_goals || [];
    const candidateGoals = qualities2.relationship_goals || [];
    const sharedGoals = userGoals.filter((goal: string) => candidateGoals.includes(goal));
    if (sharedGoals.length > 0) {
      mentalScore += 30;
    }

    // Values compatibility
    maxMentalScore += 30;
    const userValues = qualities1.values || [];
    const candidateValues = qualities2.values || [];
    const sharedValues = userValues.filter((value: string) => candidateValues.includes(value));
    mentalScore += Math.min(sharedValues.length * 10, 30);

    const finalPhysicalScore = maxPhysicalScore > 0 ? Math.round((physicalScore / maxPhysicalScore) * 100) : 0;
    const finalMentalScore = maxMentalScore > 0 ? Math.round((mentalScore / maxMentalScore) * 100) : 0;
    const overallScore = Math.round((finalMentalScore * 0.6) + (finalPhysicalScore * 0.4));

    // Fallback scores if calculation results in zero (no data available)
    let overall_score = overallScore;
    let physical_score = finalPhysicalScore;
    let mental_score = finalMentalScore;

    if (overall_score === 0 && physical_score === 0 && mental_score === 0) {
      overall_score = 63;
      physical_score = 50;
      mental_score = 75;
    }

    return {
      physical_score,
      mental_score,
      overall_score,
      shared_interests: sharedInterests,
      compatibility_reasons: generateCompatibilityReasons(qualities1, qualities2, sharedInterests, sharedGoals, sharedValues)
    };
  } catch (error) {
    console.error("Error calculating compatibility:", error);
    return {
      physical_score: 63,
      mental_score: 75,
      overall_score: 50,
      shared_interests: [],
      compatibility_reasons: []
    };
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

function calculatePhysicalCompatibility(
  qualities1: any, requirements1: any, 
  qualities2: any, requirements2: any,
  profile1: any, profile2: any
): number {
  let score = 0;
  let maxScore = 0;

  // Height compatibility (both ways)
  maxScore += 20;
  if (profile1.height && profile2.height) {
    const height1 = profile1.height;
    const height2 = profile2.height;
    
    // Check if user1 meets user2's height requirements
    const req2Min = requirements2.height_range_min || 150;
    const req2Max = requirements2.height_range_max || 200;
    if (height1 >= req2Min && height1 <= req2Max) score += 10;
    
    // Check if user2 meets user1's height requirements
    const req1Min = requirements1.height_range_min || 150;
    const req1Max = requirements1.height_range_max || 200;
    if (height2 >= req1Min && height2 <= req1Max) score += 10;
  }

  // Body type compatibility
  maxScore += 15;
  if (qualities1.body_type && qualities2.body_type) {
    const bodyType1 = qualities1.body_type;
    const bodyType2 = qualities2.body_type;
    const preferredBodies1 = requirements1.preferred_body_types || [];
    const preferredBodies2 = requirements2.preferred_body_types || [];
    
    // If no preferences specified, give medium score
    if (preferredBodies1.length === 0) score += 7;
    else if (preferredBodies1.includes(bodyType2)) score += 15;
    
    if (preferredBodies2.length === 0) score += 8;
    else if (preferredBodies2.includes(bodyType1)) score += 15;
  }

  // Age compatibility (calculate from date_of_birth)
  maxScore += 15;
  if (profile1.date_of_birth && profile2.date_of_birth) {
    const age1 = calculateAge(profile1.date_of_birth);
    const age2 = calculateAge(profile2.date_of_birth);
    
    const ageMin1 = requirements1.age_range_min || 18;
    const ageMax1 = requirements1.age_range_max || 30;
    const ageMin2 = requirements2.age_range_min || 18;
    const ageMax2 = requirements2.age_range_max || 30;
    
    if (age2 >= ageMin1 && age2 <= ageMax1) score += 7;
    if (age1 >= ageMin2 && age1 <= ageMax2) score += 8;
  }

  return Math.round((score / maxScore) * 100);
}

function calculateMentalCompatibility(
  qualities1: any, requirements1: any,
  qualities2: any, requirements2: any
): number {
  let score = 0;
  let maxScore = 0;

  // Professional compatibility
  maxScore += 15;
  const profession1 = qualities1.profession || '';
  const profession2 = qualities2.profession || '';
  const preferredProfessions1 = requirements1.preferred_professions || [];
  const preferredProfessions2 = requirements2.preferred_professions || [];
  
  if (preferredProfessions1.length > 0) {
    if (preferredProfessions1.includes(profession2)) {
      score += 8;
    }
  } else {
    score += 5; // Default if no preference
  }
  
  if (preferredProfessions2.length > 0) {
    if (preferredProfessions2.includes(profession1)) {
      score += 7;
    }
  } else {
    score += 5; // Default if no preference
  }

  // Shared interests (high weight)
  maxScore += 30;
  const interests1 = qualities1.interests || [];
  const interests2 = qualities2.interests || [];
  const sharedInterests = interests1.filter((interest: string) => interests2.includes(interest));
  const interestCompatibility = Math.min(sharedInterests.length * 10, 30);
  score += interestCompatibility;

  // Personality traits compatibility
  maxScore += 25;
  const traits1 = qualities1.personality_traits || [];
  const traits2 = qualities2.personality_traits || [];
  const preferredTraits1 = requirements1.preferred_personality_traits || [];
  const preferredTraits2 = requirements2.preferred_personality_traits || [];
  
  if (preferredTraits1.length > 0) {
    const traitMatches1 = traits2.filter((trait: string) => preferredTraits1.includes(trait)).length;
    score += Math.min(traitMatches1 * 8, 12);
  } else {
    score += 8; // Default score if no preferences
  }
  
  if (preferredTraits2.length > 0) {
    const traitMatches2 = traits1.filter((trait: string) => preferredTraits2.includes(trait)).length;
    score += Math.min(traitMatches2 * 8, 13);
  } else {
    score += 9; // Default score if no preferences
  }

  // Values compatibility
  maxScore += 20;
  const values1 = qualities1.values || [];
  const values2 = qualities2.values || [];
  const preferredValues1 = requirements1.preferred_values || [];
  const preferredValues2 = requirements2.preferred_values || [];
  
  if (preferredValues1.length > 0) {
    const valueMatches1 = values2.filter((value: string) => preferredValues1.includes(value)).length;
    score += Math.min(valueMatches1 * 6, 10);
  } else {
    score += 6;
  }
  
  if (preferredValues2.length > 0) {
    const valueMatches2 = values1.filter((value: string) => preferredValues2.includes(value)).length;
    score += Math.min(valueMatches2 * 6, 10);
  } else {
    score += 6;
  }

  // Relationship goals compatibility
  maxScore += 25;
  const goals1 = qualities1.relationship_goals || [];
  const goals2 = qualities2.relationship_goals || [];
  const preferredGoals1 = requirements1.preferred_relationship_goals || [];
  const preferredGoals2 = requirements2.preferred_relationship_goals || [];
  
  // Check for exact goal matches first
  const sharedGoals = goals1.filter((goal: string) => goals2.includes(goal));
  if (sharedGoals.length > 0) {
    score += 15;
  }
  
  // Check preference matches
  if (preferredGoals1.length > 0) {
    const goalMatches1 = goals2.filter((goal: string) => preferredGoals1.includes(goal)).length;
    score += Math.min(goalMatches1 * 5, 5);
  } else {
    score += 3;
  }
  
  if (preferredGoals2.length > 0) {
    const goalMatches2 = goals1.filter((goal: string) => preferredGoals2.includes(goal)).length;
    score += Math.min(goalMatches2 * 5, 5);
  } else {
    score += 2;
  }

  return Math.round((score / maxScore) * 100);
}

function findSharedInterests(interests1: string[], interests2: string[]): string[] {
  return interests1.filter(interest => interests2.includes(interest));
}

function generateCompatibilityReasons(
  qualities1: any, qualities2: any,
  sharedInterests: string[], sharedGoals: string[], sharedValues: string[]
): string[] {
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

export async function getCompatibleProfiles(userId: string, limit: number = 10): Promise<any[]> {
  try {
    // Get user's profile and requirements
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (userError || !userProfile) {
      console.error("Error fetching user profile:", userError);
      return [];
    }

    const userRequirements = parseJSON(userProfile.requirements);
    
    // Get potential matches (exclude already swiped)
    const { data: swipedUsers } = await supabase
      .from("enhanced_swipes")
      .select("target_user_id")
      .eq("user_id", userId);

    const swipedUserIds = swipedUsers?.map(s => s.target_user_id) || [];

    let query = supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .eq("show_profile", true)
      .neq("user_id", userId);

    // Exclude swiped users
    if (swipedUserIds.length > 0) {
      query = query.not("user_id", "in", `(${swipedUserIds.join(',')})`);
    }

    // Apply basic filters based on requirements
    if (userRequirements.age_range_min || userRequirements.age_range_max) {
      const today = new Date();
      if (userRequirements.age_range_max) {
        const minBirthDate = new Date(today.getFullYear() - userRequirements.age_range_max - 1, today.getMonth(), today.getDate());
        query = query.gte('date_of_birth', minBirthDate.toISOString().split('T')[0]);
      }
      if (userRequirements.age_range_min) {
        const maxBirthDate = new Date(today.getFullYear() - userRequirements.age_range_min, today.getMonth(), today.getDate());
        query = query.lte('date_of_birth', maxBirthDate.toISOString().split('T')[0]);
      }
    }

    const { data: candidates, error: candidatesError } = await query.limit(limit * 2); // Get more to filter

    if (candidatesError) {
      console.error("Error fetching candidates:", candidatesError);
      return [];
    }

    if (!candidates || candidates.length === 0) {
      return [];
    }

    // Calculate compatibility scores for all candidates
    const candidatesWithScores = await Promise.all(
      candidates.map(async (candidate) => {
        const compatibility = await calculateCompatibility(userId, candidate.user_id);
        return {
          ...candidate,
          compatibility_score: compatibility.overall_score,
          shared_interests: compatibility.shared_interests,
          compatibility_reasons: compatibility.compatibility_reasons
        };
      })
    );

    // Sort by compatibility score and return top matches
    return candidatesWithScores
      .filter(candidate => candidate.compatibility_score > 30) // Minimum compatibility threshold
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, limit);
      
  } catch (error) {
    console.error("Error getting compatible profiles:", error);
    return [];
  }
}