import { supabase } from "@/integrations/supabase/client";
import { getMatches } from "./matching";

export interface BlindDateRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  message: string;
  location: string;
  proposed_date: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface BlindDateMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'revealed' | 'completed';
  pre_chat_answers: any;
  number_shared: boolean;
  created_at: string;
}

export async function createBlindDateRequest(
  requesterId: string,
  message: string,
  location: string,
  proposedDate: string
): Promise<string | null> {
  try {
    // Find the best match for a blind date
    const matches = await getMatches(requesterId, 1);
    
    if (matches.length === 0) {
      throw new Error("No suitable matches found for blind date");
    }

    const bestMatch = matches[0];

    const { data, error } = await supabase
      .from("blind_dates")
      .insert({
        requester_id: requesterId,
        recipient_id: bestMatch.user_id,
        message,
        location,
        proposed_date: proposedDate,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating blind date request:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("Error in createBlindDateRequest:", error);
    return null;
  }
}

export async function acceptBlindDate(blindDateId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("blind_dates")
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq("id", blindDateId)
      .eq("recipient_id", userId);

    if (error) {
      console.error("Error accepting blind date:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in acceptBlindDate:", error);
    return false;
  }
}

export async function rejectBlindDate(blindDateId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("blind_dates")
      .update({ 
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq("id", blindDateId)
      .eq("recipient_id", userId);

    if (error) {
      console.error("Error rejecting blind date:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in rejectBlindDate:", error);
    return false;
  }
}

export async function getBlindDateRequests(userId: string): Promise<BlindDateRequest[]> {
  try {
    const { data, error } = await supabase
      .from("blind_dates")
      .select("*")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blind date requests:", error);
      return [];
    }

    return data as BlindDateRequest[] || [];
  } catch (error) {
    console.error("Error in getBlindDateRequests:", error);
    return [];
  }
}

export async function getPendingBlindDateRequests(userId: string): Promise<BlindDateRequest[]> {
  try {
    const { data, error } = await supabase
      .from("blind_dates")
      .select("*")
      .eq("recipient_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending blind date requests:", error);
      return [];
    }

    return data as BlindDateRequest[] || [];
  } catch (error) {
    console.error("Error in getPendingBlindDateRequests:", error);
    return [];
  }
}

export async function getAcceptedBlindDates(userId: string): Promise<BlindDateRequest[]> {
  try {
    const { data, error } = await supabase
      .from("blind_dates")
      .select("*")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("status", "accepted")
      .order("proposed_date", { ascending: true });

    if (error) {
      console.error("Error fetching accepted blind dates:", error);
      return [];
    }

    return data as BlindDateRequest[] || [];
  } catch (error) {
    console.error("Error in getAcceptedBlindDates:", error);
    return [];
  }
}

export async function completeBlindDate(blindDateId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("blind_dates")
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq("id", blindDateId);

    if (error) {
      console.error("Error completing blind date:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in completeBlindDate:", error);
    return false;
  }
}

// Pre-chat questions for blind dates
export const BLIND_DATE_QUESTIONS = [
  "What's your ideal first date activity?",
  "Coffee or tea person?",
  "What's your favorite type of cuisine?",
  "Are you more of an indoor or outdoor person?",
  "What's your go-to conversation starter?",
  "What's something you're passionate about?",
  "What's your favorite way to spend a weekend?",
  "Are you a morning person or night owl?"
];

export async function savePreChatAnswers(
  blindDateId: string,
  userId: string,
  answers: Record<string, string>
): Promise<boolean> {
  try {
    // Note: This function is for future enhancement when pre_chat_answers column is added to blind_dates table
    // For now, we'll just return true as a placeholder
    console.log("Pre-chat answers would be saved for blind date:", blindDateId, "User:", userId, "Answers:", answers);
    
    // This would work if pre_chat_answers column existed in blind_dates table
    /* 
    // Get current blind date data
    const { data: blindDate, error: fetchError } = await supabase
      .from("blind_dates")
      .select("pre_chat_answers")
      .eq("id", blindDateId)
      .single();

    if (fetchError || !blindDate) {
      console.error("Error fetching blind date:", fetchError);
      return false;
    }

    // Update with user's answers
    const currentAnswers = blindDate.pre_chat_answers || {};
    const updatedAnswers = {
      ...currentAnswers,
      [userId]: answers
    };

    const { error } = await supabase
      .from("blind_dates")
      .update({ 
        pre_chat_answers: updatedAnswers,
        updated_at: new Date().toISOString()
      })
      .eq("id", blindDateId);

    if (error) {
      console.error("Error saving pre-chat answers:", error);
      return false;
    }
    */

    return true;
  } catch (error) {
    console.error("Error in savePreChatAnswers:", error);
    return false;
  }
}