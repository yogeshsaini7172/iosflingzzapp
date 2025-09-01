import { supabase } from "@/integrations/supabase/client";

export interface VerificationResult {
  success: boolean;
  message: string;
  confidence?: number;
}

export async function uploadVerificationDocument(
  file: File,
  userId: string,
  documentType: 'college' | 'govt'
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}_id_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading verification document:', error);
    return null;
  }
}

export async function submitVerificationDocuments(
  userId: string,
  collegeIdUrl: string,
  govtIdUrl: string
): Promise<VerificationResult> {
  try {
    // Update or create identity verification record
    const { error: upsertError } = await supabase
      .from("identity_verifications")
      .upsert({
        user_id: userId,
        student_id_image_url: collegeIdUrl,
        govt_id_image_url: govtIdUrl,
        student_id_status: 'pending',
        govt_id_status: 'pending',
        student_id_submitted_at: new Date().toISOString(),
        govt_id_submitted_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error updating verification record:', upsertError);
      return {
        success: false,
        message: 'Failed to submit verification documents'
      };
    }

    // Update profile verification status
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ verification_status: 'pending' })
      .eq("user_id", userId);

    if (profileError) {
      console.error('Error updating profile verification status:', profileError);
    }

    return {
      success: true,
      message: 'Verification documents submitted successfully. Review typically takes 24-48 hours.'
    };
  } catch (error) {
    console.error('Error submitting verification documents:', error);
    return {
      success: false,
      message: 'An error occurred while submitting documents'
    };
  }
}

export async function getVerificationStatus(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("identity_verifications")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching verification status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getVerificationStatus:', error);
    return null;
  }
}

export async function approveVerification(
  userId: string,
  documentType: 'college' | 'govt',
  reviewerId: string
): Promise<boolean> {
  try {
    const updateData: any = {
      [`${documentType === 'college' ? 'student' : 'govt'}_id_status`]: 'approved',
      [`${documentType === 'college' ? 'student' : 'govt'}_id_verified_at`]: new Date().toISOString()
    };

    const { error: verificationError } = await supabase
      .from("identity_verifications")
      .update(updateData)
      .eq("user_id", userId);

    if (verificationError) {
      console.error('Error approving verification:', verificationError);
      return false;
    }

    // Check if both documents are now approved
    const { data: verification } = await supabase
      .from("identity_verifications")
      .select("student_id_status, govt_id_status")
      .eq("user_id", userId)
      .single();

    if (verification?.student_id_status === 'approved' && verification?.govt_id_status === 'approved') {
      // Update profile to verified status
      await supabase
        .from("profiles")
        .update({ 
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          student_id_verified: true,
          govt_id_verified: true
        })
        .eq("user_id", userId);
    }

    return true;
  } catch (error) {
    console.error('Error in approveVerification:', error);
    return false;
  }
}

export async function rejectVerification(
  userId: string,
  documentType: 'college' | 'govt',
  reason: string,
  reviewerId: string
): Promise<boolean> {
  try {
    const updateData: any = {
      [`${documentType === 'college' ? 'student' : 'govt'}_id_status`]: 'rejected',
      rejection_reason: reason
    };

    const { error: verificationError } = await supabase
      .from("identity_verifications")
      .update(updateData)
      .eq("user_id", userId);

    if (verificationError) {
      console.error('Error rejecting verification:', verificationError);
      return false;
    }

    // Update profile verification status
    await supabase
      .from("profiles")
      .update({ verification_status: 'rejected' })
      .eq("user_id", userId);

    return true;
  } catch (error) {
    console.error('Error in rejectVerification:', error);
    return false;
  }
}

export async function getPendingVerifications(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("identity_verifications")
      .select(`
        *,
        profile:profiles(first_name, last_name, email, university)
      `)
      .or("student_id_status.eq.pending,govt_id_status.eq.pending")
      .order("student_id_submitted_at", { ascending: false });

    if (error) {
      console.error('Error fetching pending verifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPendingVerifications:', error);
    return [];
  }
}

// Simulate OCR text extraction (in a real app, this would use Google Vision API or similar)
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  // This is a placeholder - in production you'd integrate with OCR service
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Simulated OCR text extraction result");
    }, 1000);
  });
}

// Basic validation helpers
export function validateIDInformation(
  collegeText: string,
  govtText: string,
  userProfile: any
): VerificationResult {
  // This is a simplified validation - in production you'd have more sophisticated checks
  const hasName = collegeText.toLowerCase().includes(userProfile.first_name.toLowerCase()) ||
                  govtText.toLowerCase().includes(userProfile.first_name.toLowerCase());
  
  const hasCollege = collegeText.toLowerCase().includes(userProfile.university.toLowerCase());
  
  if (hasName && hasCollege) {
    return {
      success: true,
      message: 'ID information validation passed',
      confidence: 85
    };
  }
  
  return {
    success: false,
    message: 'ID information validation failed - information does not match profile',
    confidence: 30
  };
}