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

      // Get QCS score (20% of total) - Use profile.total_qcs with fallback
      let qcsScore = candidate.total_qcs || 0;
      if (qcsScore === 0) {
        // Fallback: try to get from qcs table
        const qcsData = await getQCSScore(candidate.user_id);
        qcsScore = qcsData ? qcsData.total_score : 50;
      }
      qcsScore = Math.min(100, qcsScore);

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
    // Normalize ordering so we always query with user1=userMin user2=userMax
    const u1 = likerId < likedId ? likerId : likedId;
    const u2 = likerId < likedId ? likedId : likerId;

    // try enhanced_matches first
    const { data: existingEnhanced } = await supabase
      .from('enhanced_matches')
      .select('*')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .maybeSingle();

    if (existingEnhanced) {
      // if the status is not matched but both swiped = true, consider matched
      if (existingEnhanced.status !== 'matched' &&
          existingEnhanced.user1_swiped && existingEnhanced.user2_swiped) {
        await supabase
          .from('enhanced_matches')
          .update({ status: 'matched' })
          .eq('id', existingEnhanced.id);
        return true;
      }
      return existingEnhanced.status === 'matched';
    }

    // fallback: (optional) check legacy matches table if you still have data there
    const { data: legacyMatch } = await supabase
      .from('matches')
      .select('*')
      .or(`and(liker_id.eq.${likerId},liked_id.eq.${likedId}),and(liker_id.eq.${likedId},liked_id.eq.${likerId})`)
      .maybeSingle();

    if (legacyMatch) {
      // Optionally migrate to enhanced_matches or call server to reconcile
      return legacyMatch.status === 'matched';
    }

    return false;
  } catch (error) {
    console.error("Error in createMatch:", error);
    return false;
  }
}

export async function getUserMatches(userId: string): Promise<MatchCandidate[]> {
  try {
    // Get matches from enhanced_matches where this user is involved and status is matched
    const { data: enhancedMatches, error } = await supabase
      .from("enhanced_matches")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq("status", "matched");

    if (error) {
      console.error("Error fetching enhanced matches:", error);
      return [];
    }

    const matchProfiles: MatchCandidate[] = [];

    // Process enhanced matches
    if (enhancedMatches) {
      for (const match of enhancedMatches) {
        // Get the other user's profile
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        
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
    }

    // Fallback: also check legacy matches table for backward compatibility
    const { data: legacyMatches } = await supabase
      .from("matches")
      .select("*")
      .or(`liker_id.eq.${userId},liked_id.eq.${userId}`)
      .eq("status", "matched");

    if (legacyMatches) {
      for (const match of legacyMatches) {
        // Get the other user's profile (avoid duplicates)
        const otherUserId = match.liker_id === userId ? match.liked_id : match.liker_id;
        
        // Skip if we already have this user from enhanced matches
        if (matchProfiles.some(p => p.user_id === otherUserId)) continue;
        
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", otherUserId)
          .single();

        if (profileError || !profile) {
          console.error("Error fetching legacy match profile:", profileError);
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
    }

    return matchProfiles;
  } catch (error) {
    console.error("Error getting user matches:", error);
    return [];
  }
}