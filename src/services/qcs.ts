import { supabase } from "@/integrations/supabase/client";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";

export interface QCSScore {
  profile_score: number;
  college_tier: number;
  personality_depth: number;
  behavior_score: number;
  total_score: number;
}

export async function calculateQCS(userId: string): Promise<number> {
  try {
    // Use secure Edge Function that handles auth and persists results
    const response = await fetchWithFirebaseAuth(
      "https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/qcs-scoring",
      {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({} as any));
      console.error("QCS scoring function failed:", err);
      return 0;
    }

    const result = await response.json();
    // Try common fields returned by the function; fallback to 0
    const finalScore =
      (result?.qcs?.total_score ??
        result?.updated_qcs ??
        result?.final_score ??
        result?.score ??
        0) as number;

    console.log(`QCS (edge) calculated for ${userId}: ${finalScore}`);
    return typeof finalScore === "number" ? finalScore : 0;
  } catch (error) {
    console.error("Error invoking QCS scoring:", error);
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