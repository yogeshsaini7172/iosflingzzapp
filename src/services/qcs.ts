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

    // Handle different response structures - fix type conversion issues
    let finalScore = 0;
    
    // Check if response has qcs object structure
    if (result?.qcs && typeof result.qcs === 'object') {
      finalScore = result.qcs.total_score;
    }
    // Check for direct total_score
    else if (result?.total_score !== undefined) {
      finalScore = result.total_score;
    }
    // Check for other possible field names
    else if (result?.updated_qcs !== undefined) {
      finalScore = result.updated_qcs;
    }
    else if (result?.final_score !== undefined) {
      finalScore = result.final_score;
    }
    else if (result?.score !== undefined) {
      finalScore = result.score;
    }
    else if (result?.qcs_score !== undefined) {
      finalScore = result.qcs_score;
    }

    // Ensure we have a valid number
    finalScore = Number(finalScore) || 0;
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    console.log(`✅ QCS calculated for ${userId}: ${finalScore} (ai_score: ${result?.qcs?.ai_score || result?.ai_score || 'null'}, logic_score: ${result?.qcs?.logic_score || result?.logic_score || 'null'})`);
    
    // Log if we're getting incomplete data
    if (!result?.qcs?.ai_score && !result?.ai_score && !result?.qcs?.logic_score && !result?.logic_score) {
      console.warn(`⚠️ Incomplete QCS data for ${userId} - missing AI/logic breakdown`);
    }
    
    return finalScore;
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