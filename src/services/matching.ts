import { supabase } from "@/integrations/supabase/client";
import { getQCSScore } from "./qcs";

export interface MatchCandidate {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  bio: string;
  profile_images: string[];
  interests: string[];
  university: string;
  major: string;
  year_of_study: number;
  gender: string;
  relationship_goals: string[];
  lifestyle: any;
  personality_type: string;
  compatibility_score: number;
  physical_score: number;
  mental_score: number;
  qcs_score: number;
}

export interface UserPreferences {
  preferred_gender: string[];
  age_range_min: number;
  age_range_max: number;
  preferred_relationship_goal: string[];
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

function calculateJaccardSimilarity(setA: string[], setB: string[]): number {
  if (!setA || !setB || setA.length === 0 || setB.length === 0) return 0;
  
  const set1 = new Set(setA);
  const set2 = new Set(setB);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

export async function getMatches(userId: string, limit: number = 10): Promise<MatchCandidate[]> {
  try {
    // Get current user's profile and preferences
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: userPreferences } = await supabase
      .from("partner_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const userAge = calculateAge(userProfile.date_of_birth);
    
    // Get potential matches with basic filtering
    let query = supabase
      .from("profiles")
      .select("*")
      .neq("user_id", userId)
      .eq("is_active", true);

    // Apply gender filter if preferences exist
    if (userPreferences?.preferred_gender && userPreferences.preferred_gender.length > 0) {
      const validGenders = userPreferences.preferred_gender.filter(gender => 
        ['male', 'female', 'non_binary', 'prefer_not_to_say'].includes(gender)
      ) as ('male' | 'female' | 'non_binary' | 'prefer_not_to_say')[];
      
      if (validGenders.length > 0) {
        query = query.in("gender", validGenders);
      }
    }

    const { data: potentialMatches, error } = await query;

    if (error) {
      console.error("Error fetching potential matches:", error);
      return [];
    }

    if (!potentialMatches) return [];

    // Get blocked users
    const { data: blockedUsers } = await supabase
      .from("blocks")
      .select("blocked_user_id")
      .eq("user_id", userId);

    const blockedUserIds = new Set(blockedUsers?.map(b => b.blocked_user_id) || []);

    // Calculate compatibility for each candidate
    const matches: MatchCandidate[] = [];

    for (const candidate of potentialMatches) {
      // Skip blocked users
      if (blockedUserIds.has(candidate.user_id)) continue;

      const candidateAge = calculateAge(candidate.date_of_birth);

      // Apply age filter if preferences exist
      if (userPreferences) {
        if (candidateAge < userPreferences.age_range_min || 
            candidateAge > userPreferences.age_range_max) {
          continue;
        }
      }

      // Calculate physical compatibility (40% of total)
      let physicalScore = 0;
      
      // Age compatibility (within 5 years gets full points)
      const ageDiff = Math.abs(userAge - candidateAge);
      physicalScore += Math.max(0, 50 - ageDiff * 5);

      // University tier compatibility
      if (candidate.college_tier === userProfile.college_tier) {
        physicalScore += 30;
      } else if (Math.abs(
        (candidate.college_tier === 'tier1' ? 1 : candidate.college_tier === 'tier2' ? 2 : 3) -
        (userProfile.college_tier === 'tier1' ? 1 : userProfile.college_tier === 'tier2' ? 2 : 3)
      ) === 1) {
        physicalScore += 15;
      }

      // Lifestyle compatibility
      if (candidate.lifestyle && userProfile.lifestyle) {
        const lifestyleMatch = calculateJaccardSimilarity(
          Object.keys(candidate.lifestyle),
          Object.keys(userProfile.lifestyle)
        );
        physicalScore += lifestyleMatch * 20;
      }

      physicalScore = Math.min(100, physicalScore);

      // Calculate mental compatibility (40% of total)
      let mentalScore = 0;

      // Interests similarity
      const interestsSimilarity = calculateJaccardSimilarity(
        candidate.interests || [],
        userProfile.interests || []
      );
      mentalScore += interestsSimilarity * 50;

      // Relationship goals compatibility
      const goalsSimilarity = calculateJaccardSimilarity(
        candidate.relationship_goals || [],
        userProfile.relationship_goals || []
      );
      mentalScore += goalsSimilarity * 30;

      // Personality type compatibility
      if (candidate.personality_type && userProfile.personality_type) {
        if (candidate.personality_type === userProfile.personality_type) {
          mentalScore += 20;
        }
      }

      mentalScore = Math.min(100, mentalScore);

      // Get QCS score (20% of total)
      const qcsData = await getQCSScore(candidate.user_id);
      const qcsScore = qcsData ? Math.min(100, qcsData.total_score) : 50;

      // Final compatibility score
      const compatibilityScore = Math.round(
        (physicalScore * 0.4) + (mentalScore * 0.4) + (qcsScore * 0.2)
      );

      matches.push({
        ...candidate,
        age: candidateAge,
        compatibility_score: compatibilityScore,
        physical_score: Math.round(physicalScore),
        mental_score: Math.round(mentalScore),
        qcs_score: Math.round(qcsScore)
      });
    }

    // Sort by compatibility score and return top matches
    return matches
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, limit);

  } catch (error) {
    console.error("Error getting matches:", error);
    return [];
  }
}

export async function createMatch(likerId: string, likedId: string): Promise<boolean> {
  try {
    // Check if there's already a match between these users
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("*")
      .or(`and(liker_id.eq.${likerId},liked_id.eq.${likedId}),and(liker_id.eq.${likedId},liked_id.eq.${likerId})`)
      .maybeSingle();

    if (existingMatch) {
      // If the other person already liked us, it's a mutual match
      if (existingMatch.liker_id === likedId && existingMatch.liked_id === likerId) {
        await supabase
          .from("matches")
          .update({ status: 'matched' })
          .eq("id", existingMatch.id);
        return true;
      }
      return false;
    }

    // Create new match with the correct status value
    const { error } = await supabase
      .from("matches")
      .insert({
        liker_id: likerId,
        liked_id: likedId,
        status: 'liked' as const
      });

    if (error) {
      console.error("Error creating match:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in createMatch:", error);
    return false;
  }
}

export async function getUserMatches(userId: string): Promise<MatchCandidate[]> {
  try {
    // Get matches where this user is involved and status is matched
    const { data: matches, error } = await supabase
      .from("matches")
      .select("*")
      .or(`liker_id.eq.${userId},liked_id.eq.${userId}`)
      .eq("status", "matched");

    if (error) {
      console.error("Error fetching user matches:", error);
      return [];
    }

    if (!matches) return [];

    const matchProfiles: MatchCandidate[] = [];

    for (const match of matches) {
      // Get the other user's profile
      const otherUserId = match.liker_id === userId ? match.liked_id : match.liker_id;
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", otherUserId)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching match profile:", profileError);
        continue;
      }

      if (profile.date_of_birth) {
        const age = calculateAge(profile.date_of_birth);
        
        matchProfiles.push({
          ...profile,
          age,
          compatibility_score: 0, // Could be calculated if needed
          physical_score: 0,
          mental_score: 0,
          qcs_score: 0
        });
      }
    }

    return matchProfiles;
  } catch (error) {
    console.error("Error getting user matches:", error);
    return [];
  }
}