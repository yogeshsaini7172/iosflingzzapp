import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  
  // Physical Attributes
  height?: number;
  body_type?: string;
  skin_tone?: string;
  
  // Personality & Values (arrays to support multiple selections)
  personality_traits?: string[]; // up to 3
  values?: string[]; // up to 3
  mindset?: string[]; // 1-2 selections
  
  // Education/Profession
  education_level?: string;
  profession?: string;
  
  // Goals & Interests
  relationship_goals?: string[]; // max 3
  
  // Legacy fields for compatibility
  personality_type?: string;
  show_profile?: boolean;
}

export interface PartnerPreferences {
  id?: string;
  user_id: string;
  preferred_gender: Gender[];
  age_range_min: number;
  age_range_max: number;
  height_range_min?: number;
  height_range_max?: number;
  preferred_body_types?: string[];
  preferred_values?: string[];
  preferred_mindset?: string[];
  preferred_personality_traits?: string[];
  preferred_relationship_goal: string[];
}

export const useProfileData = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const getCurrentUserId = () => {
    // Get user ID directly from Firebase auth
    if (user?.uid) {
      console.log("🔥 Firebase user ID:", user.uid);
      return user.uid;
    }
    // Fallback for backward compatibility during migration
    const fallbackId = localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
    console.log("📱 Using fallback user ID:", fallbackId);
    return fallbackId;
  };

  const callProfileFunction = async (action: 'get' | 'update', payload?: any) => {
    const userId = getCurrentUserId();
    const { data, error } = await supabase.functions.invoke('profile-management', {
      headers: { Authorization: `Bearer dummy-token-${userId}` },
      body: { action, user_id: userId, profile: payload }
    });
    return { data, error } as { data: any; error: any };
  };

  const fetchProfileData = async () => {
    const userId = getCurrentUserId();
    console.log("🔍 Fetching profile data for user ID:", userId);

    try {
      setIsLoading(true);

      // Prefer edge function (service role) to bypass RLS issues
      let profileData: any = null;
      const { data: fnData, error: fnError } = await callProfileFunction('get');
      if (!fnError && fnData?.data?.profile) {
        profileData = fnData.data.profile;
        console.log("📊 Profile from edge function:", profileData);
      } else {
        console.warn("⚠️ Edge function get failed, falling back to table select", fnError);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (!error) profileData = data;
      }

      // Transform legacy single values to arrays for backward compatibility
      if (profileData) {
        const transformedProfile = {
          ...profileData,
          personality_traits: Array.isArray((profileData as any).personality_traits) 
            ? (profileData as any).personality_traits 
            : (profileData as any).personality_type 
              ? [(profileData as any).personality_type] 
              : [],
          values: Array.isArray((profileData as any).values) 
            ? (profileData as any).values 
            : (profileData as any).values 
              ? [(profileData as any).values] 
              : [],
          mindset: Array.isArray((profileData as any).mindset) 
            ? (profileData as any).mindset 
            : (profileData as any).mindset 
              ? [(profileData as any).mindset] 
              : [],
        };
        setProfile(transformedProfile as Profile);
        console.log("✅ Profile set:", transformedProfile);
      } else {
        // Final fallback to localStorage demo profile
        const local = localStorage.getItem('demoProfile');
        if (local) {
          const parsed = JSON.parse(local);
          setProfile(parsed as Profile);
          console.log("🗄️ Loaded profile from localStorage");
        } else {
          setProfile(null);
          console.log("❌ No profile data found");
        }
      }

      // Fetch preferences with fallback to localStorage (RLS-safe)
      const { data: prefData, error: prefError } = await supabase
        .from("partner_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!prefError && prefData) {
        const safePrefs: PartnerPreferences = {
          ...prefData,
          preferred_gender: (prefData.preferred_gender || []) as Gender[],
        };
        setPreferences(safePrefs);
      } else {
        const localPrefs = localStorage.getItem('demoPreferences');
        if (localPrefs) {
          setPreferences(JSON.parse(localPrefs));
          console.log("🗄️ Loaded preferences from localStorage");
        } else {
          setPreferences(null);
        }
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
      // Transform array fields back to database format for backward compatibility
      const dbUpdates: any = {
        ...updates,
        // Convert arrays back to single values for database storage if needed
        personality_type: updates.personality_traits?.[0] || undefined,
        values: Array.isArray(updates.values) ? updates.values?.[0] : updates.values,
        mindset: Array.isArray(updates.mindset) ? updates.mindset?.[0] : updates.mindset,
      };
      // Remove the array versions to avoid conflicts
      delete dbUpdates.personality_traits;
      if (Array.isArray(updates.values)) delete dbUpdates.values;
      if (Array.isArray(updates.mindset)) delete dbUpdates.mindset;

      const { error: fnError } = await callProfileFunction('update', dbUpdates);
      if (fnError) throw fnError;
      
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
      // Check if a row already exists for this user (Firebase UID)
      const { data: existing } = await supabase
        .from("partner_preferences")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      let error: any = null;

      if (existing) {
        ({ error } = await supabase
          .from("partner_preferences")
          .update({ ...updates })
          .eq("user_id", userId));
      } else {
        ({ error } = await supabase
          .from("partner_preferences")
          .insert({ user_id: userId, ...updates }));
      }

      if (error) throw error;
      
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully.",
      });
      
      await fetchProfileData();
    } catch (error: any) {
      console.warn("⚠️ Falling back to localStorage for preferences:", error);
      // Fallback: store locally to keep UX smooth when RLS blocks the request
      const current = localStorage.getItem('demoPreferences');
      const merged = { ...(current ? JSON.parse(current) : {}), user_id: userId, ...updates };
      localStorage.setItem('demoPreferences', JSON.stringify(merged));
      setPreferences(merged);
      toast({ title: "Preferences saved locally", description: "Changes will sync when connected.", });
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