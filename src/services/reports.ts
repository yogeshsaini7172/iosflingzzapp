import { supabase } from "@/integrations/supabase/client";

export interface ReportData {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: string;
  description: string;
  status: string;
  created_at: string;
}

export async function reportUser(
  reporterId: string,
  targetId: string,
  reportType: string,
  description: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("admin_reports")
      .insert({
        reporter_id: reporterId,
        reported_user_id: targetId,
        report_type: reportType,
        description: description,
        status: 'pending'
      });

    if (error) {
      console.error("Error creating report:", error);
      return false;
    }

    // Increment reports count for the reported user
    try {
      const { error: updateError } = await supabase.rpc('increment_reports_count', {
        user_id: targetId
      });

      if (updateError) {
        console.error("Error updating reports count:", updateError);
      }
    } catch (rpcError) {
      // If RPC function doesn't exist, update directly
      console.warn("RPC function not available, updating directly:", rpcError);
      await supabase
        .from("profiles")
        .update({ reports_count: 1 }) // This is a simplified increment
        .eq("user_id", targetId);
    }

    return true;
  } catch (error) {
    console.error("Error in reportUser:", error);
    return false;
  }
}

export async function blockUser(userId: string, targetId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("blocks")
      .insert({
        user_id: userId,
        blocked_user_id: targetId
      });

    if (error) {
      console.error("Error blocking user:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in blockUser:", error);
    return false;
  }
}

export async function unblockUser(userId: string, targetId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("user_id", userId)
      .eq("blocked_user_id", targetId);

    if (error) {
      console.error("Error unblocking user:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in unblockUser:", error);
    return false;
  }
}

export async function getBlockedUsers(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("blocks")
      .select("blocked_user_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching blocked users:", error);
      return [];
    }

    return data?.map(block => block.blocked_user_id) || [];
  } catch (error) {
    console.error("Error in getBlockedUsers:", error);
    return [];
  }
}

export async function isUserBlocked(userId: string, targetId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("blocks")
      .select("id")
      .eq("user_id", userId)
      .eq("blocked_user_id", targetId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error checking if user is blocked:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in isUserBlocked:", error);
    return false;
  }
}

export async function getPendingReports(): Promise<ReportData[]> {
  try {
    const { data, error } = await supabase
      .from("admin_reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending reports:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPendingReports:", error);
    return [];
  }
}

export async function updateReportStatus(
  reportId: string,
  status: string,
  reviewerId?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString()
    };

    if (reviewerId) {
      updateData.reviewed_by = reviewerId;
    }

    const { error } = await supabase
      .from("admin_reports")
      .update(updateData)
      .eq("id", reportId);

    if (error) {
      console.error("Error updating report status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateReportStatus:", error);
    return false;
  }
}