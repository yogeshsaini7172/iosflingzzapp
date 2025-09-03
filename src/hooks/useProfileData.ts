import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: Gender;
  university: string;
  bio?: string;
  interests?: string[];
  profile_images?: string[];
  subscription_tier: string;
  swipes_left: number;
  pairing_requests_left: number;
  blinddate_requests_left: number;
  is_profile_public: boolean;
  verification_status: string;
  total_qcs?: number;
}

export interface PartnerPreferences {
  id?: string;
  user_id: string;
  preferred_gender: Gender[];   // ✅ specific string literals
  age_range_min: number;
  age_range_max: number;
  preferred_relationship_goal: string[];
}

export const useProfileData = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getCurrentUserId = () => {
    return localStorage.getItem("demoUserId") || "alice-johnson-123";
  };

  const fetchProfileData = async () => {
    const userId = getCurrentUserId();

    try {
      setIsLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch preferences
      const { data: prefData, error: prefError } = await supabase
        .from("partner_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!prefError && prefData) {
        // Cast gender safely
        const safePrefs: PartnerPreferences = {
          ...prefData,
          preferred_gender: (prefData.preferred_gender || []) as Gender[],
        };
        setPreferences(safePrefs);
      }
    } catch (error: any) {
      console.error("❌ Error fetching profile data:", error);
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return {
    profile,
    preferences,
    isLoading,
    refetch: fetchProfileData,
  };
};
