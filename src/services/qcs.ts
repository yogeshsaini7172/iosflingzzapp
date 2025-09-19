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
    console.log('🔄 Calculating QCS for user:', userId);
    
    // Use the manual QCS trigger function that works reliably
    const { data, error } = await supabase.functions.invoke('manual-qcs-trigger', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('❌ QCS calculation error:', error);
      return 0;
    }

    console.log('✅ QCS calculation successful:', data);
    return data?.qcs_score || 0;
  } catch (error) {
    console.error('❌ QCS calculation failed:', error);
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