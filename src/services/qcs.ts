import { supabase } from "@/integrations/supabase/client";

export interface QCSScore {
  profile_score: number;
  college_tier: number;
  personality_depth: number;
  behavior_score: number;
  total_score: number;
}

export async function calculateQCS(userId: string): Promise<number> {
  try {
    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return 0;
    }

    // Parse qualities JSON
    let qualities: any = {};
    try {
      qualities = profile.qualities ? JSON.parse(profile.qualities as string) : {};
    } catch (e) {
      console.warn("Could not parse qualities JSON:", e);
      qualities = {};
    }

    // Calculate profile score (0-40 points) - Enhanced scoring
    let profileScore = 0;
    
    // Bio quality (0-15 points)
    if (profile.bio) {
      if (profile.bio.length > 150) profileScore += 15;
      else if (profile.bio.length > 50) profileScore += 10;
      else profileScore += 5;
    }
    
    // Images quality (0-15 points)
    if (profile.profile_images && profile.profile_images.length >= 4) profileScore += 15;
    else if (profile.profile_images && profile.profile_images.length >= 2) profileScore += 10;
    else if (profile.profile_images && profile.profile_images.length >= 1) profileScore += 5;
    
    // Interests diversity (0-10 points)
    if (profile.interests && profile.interests.length >= 5) profileScore += 10;
    else if (profile.interests && profile.interests.length >= 3) profileScore += 7;
    else if (profile.interests && profile.interests.length >= 1) profileScore += 3;

    // College tier score (0-30 points) - Enhanced with education level
    const collegeTierMap: Record<string, number> = {
      tier1: 30,
      tier2: 25,
      tier3: 20
    };
    let collegeTier = collegeTierMap[profile.college_tier || 'tier3'] || 20;
    
    // Bonus for higher education
    if (profile.education_level === 'phd_doctorate') collegeTier += 5;
    else if (profile.education_level === 'postgraduate') collegeTier += 3;
    else if (profile.education_level === 'undergraduate') collegeTier += 1;

    // Personality depth (0-20 points) - Enhanced personality scoring
    let personalityDepth = 0;
    
    // Personality traits depth
    if (qualities.personality_traits && qualities.personality_traits.length >= 3) personalityDepth += 8;
    else if (qualities.personality_traits && qualities.personality_traits.length >= 1) personalityDepth += 4;
    
    // Values depth  
    if (qualities.values && qualities.values.length >= 3) personalityDepth += 6;
    else if (qualities.values && qualities.values.length >= 1) personalityDepth += 3;
    
    // Mindset clarity
    if (qualities.mindset && qualities.mindset.length >= 1) personalityDepth += 3;
    
    // Relationship goals clarity
    if (qualities.relationship_goals && qualities.relationship_goals.length >= 1) personalityDepth += 3;

    // Behavior score (0-10 points, reduced by reports)
    const behaviorScore = Math.max(10 - (profile.reports_count || 0) * 2, 0);

    const totalScore = Math.min(100, profileScore + collegeTier + personalityDepth + behaviorScore);

    // Update or insert QCS record with detailed breakdown
    const { error: qcsError } = await supabase
      .from("qcs")
      .upsert({
        user_id: userId,
        profile_score: profileScore,
        college_tier: collegeTier,
        personality_depth: personalityDepth,
        behavior_score: behaviorScore,
        total_score: totalScore
      });

    if (qcsError) {
      console.error("Error updating QCS:", qcsError);
    }

    // CRITICAL FIX: Sync total_qcs to profiles table
    const { error: profileQcsError } = await supabase
      .from("profiles")
      .update({ total_qcs: totalScore })
      .eq("user_id", userId);

    if (profileQcsError) {
      console.error("Error syncing QCS to profile:", profileQcsError);
    }

    console.log(`QCS calculated for ${userId}: ${totalScore} (Profile: ${profileScore}, College: ${collegeTier}, Personality: ${personalityDepth}, Behavior: ${behaviorScore})`);
    return totalScore;
  } catch (error) {
    console.error("Error calculating QCS:", error);
    return 0;
  }
}

export async function getQCSScore(userId: string): Promise<QCSScore | null> {
  try {
    const { data, error } = await supabase
      .from("qcs")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching QCS:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting QCS score:", error);
    return null;
  }
}

export async function updateProfileCompletion(userId: string): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!profile) return;

    // Calculate completion percentage
    const { data: completionResult } = await supabase.rpc(
      'calculate_profile_completion',
      { profile_data: profile }
    );

    const completionPercentage = completionResult || 0;

    // Update profile with completion percentage
    await supabase
      .from("profiles")
      .update({ profile_completion_percentage: completionPercentage })
      .eq("user_id", userId);

    // Recalculate QCS after profile update
    await calculateQCS(userId);
  } catch (error) {
    console.error("Error updating profile completion:", error);
  }
}