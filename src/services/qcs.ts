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
    console.log(`🔄 Starting QCS calculation for user: ${userId}`);
    
    // Invoke Supabase Edge Function (reliable logging + auth via Supabase client)
    const { data, error } = await supabase.functions.invoke('qcs-scoring', {
      body: { user_id: userId },
    });

    if (error) {
      console.error('❌ QCS scoring function failed:', error);
      return 0;
    }

    const result = (data as any) || {};
    console.log(`📊 QCS edge function response for ${userId}:`, result);

    // Try common fields returned by the function; fallback to 0
    const finalScore = (
      result?.qcs?.total_score ??
      result?.updated_qcs ??
      result?.final_score ??
      result?.score ??
      result?.qcs_score ??
      0
    ) as number;

    console.log(`✅ QCS calculated for ${userId}: ${finalScore} (ai_score: ${result?.qcs?.ai_score || 'null'}, logic_score: ${result?.qcs?.logic_score || 'null'})`);
    
    // Log if we're getting incomplete data
    if (!result?.qcs?.ai_score && !result?.qcs?.logic_score) {
      console.warn(`⚠️ Incomplete QCS data for ${userId} - missing AI/logic breakdown`);
    }
    
    return typeof finalScore === 'number' ? finalScore : 0;
  } catch (error) {
    console.error('❌ Error invoking QCS scoring:', error);
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
      .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle();

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
      .or(`firebase_uid.eq.${userId},user_id.eq.${userId}`);

    // Recalculate QCS after profile update
    await calculateQCS(userId);
  } catch (error) {
    console.error("Error updating profile completion:", error);
  }
}