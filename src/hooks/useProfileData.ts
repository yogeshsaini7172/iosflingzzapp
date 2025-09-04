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
  height?: number;
  body_type?: string;
  skin_tone?: string;
  personality_type?: string;
  values?: string;
  mindset?: string;
  relationship_goals?: string[];
  show_profile?: boolean;
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
    return localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
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

  const updateProfile = async (updates: Partial<Profile>) => {
    const userId = getCurrentUserId();
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      await fetchProfileData();
    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePreferences = async (updates: Partial<PartnerPreferences>) => {
    const userId = getCurrentUserId();
    
    try {
      const { error } = await supabase
        .from("partner_preferences")
        .upsert({
          user_id: userId,
          ...updates,
        });

      if (error) throw error;
      
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully.",
      });
      
      await fetchProfileData();
    } catch (error: any) {
      console.error("❌ Error updating preferences:", error);
      toast({
        title: "Error updating preferences", 
        description: error.message,
        variant: "destructive",
      });
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
    updateProfile,
    updatePreferences,
  };
};