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

    // Calculate profile score (0-40 points)
    let profileScore = 0;
    if (profile.bio && profile.bio.length > 50) profileScore += 20;
    if (profile.profile_images && profile.profile_images.length >= 3) profileScore += 15;
    if (profile.interests && profile.interests.length >= 3) profileScore += 5;

    // College tier score (0-30 points)
    const collegeTierMap: Record<string, number> = {
      tier1: 30,
      tier2: 20,
      tier3: 10
    };
    const collegeTier = collegeTierMap[profile.college_tier || 'tier3'] || 10;

    // Personality depth (0-20 points)
    const personalityDepth = Math.min((profile.questions_answered || 0) * 2, 20);

    // Behavior score (0-10 points, reduced by reports)
    const behaviorScore = Math.max(10 - (profile.reports_count || 0) * 2, 0);

    const totalScore = profileScore + collegeTier + personalityDepth + behaviorScore;

    // Update or insert QCS record
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
      .single();

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