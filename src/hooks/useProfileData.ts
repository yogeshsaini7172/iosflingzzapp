import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { calculateQCS } from "@/services/qcs";
 
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
  face_type?: string;
  love_language?: string;
  lifestyle?: string;

  // Personality & Values (arrays to support multiple selections)
  personality_traits?: string[]; // up to 3
  values?: string[]; // up to 3
  mindset?: string[]; // 1-2 selections

  // Education/Profession
  education_level?: string;
  profession?: string;
  profession_description?: string;

  // Goals & Interests
  relationship_goals?: string[]; // max 3

  // Location
  location?: string;
  latitude?: number;
  longitude?: number;
  city?: string;

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
  preferred_skin_tone?: string[];
  preferred_face_type?: string[];
  preferred_love_language?: string[];
  preferred_lifestyle?: string[];
  preferred_professions?: string[];
}

export const useProfileData = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const getCurrentUserId = () => {
    return user?.uid ?? null;
  };

  const callDataFunction = async (action: string, payload?: any) => {
    const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/data-management', {
      method: 'POST',
      body: JSON.stringify({ action, ...payload })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData };
    }
    
    const data = await response.json();
    return { data, error: null };
  };

  const fetchProfileData = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      // No authenticated user yet — ensure loading flag is false and exit gracefully
      console.warn('Attempted to fetch profile data without authenticated user');
      setIsLoading(false);
      setProfile(null);
      setPreferences(null);
      return;
    }
    console.log("🔍 Fetching profile data for user ID:", userId);

    try {
      setIsLoading(true);

      // Use data-management edge function with service role access
      let profileData: any = null;
      const { data: fnData, error: fnError } = await callDataFunction('get_profile');
      if (!fnError && fnData?.data?.profile) {
        profileData = fnData.data.profile;
        console.log("📊 Profile from data-management function:", profileData);
      } else if (fnError) {
        console.warn("⚠️ Data management function failed:", fnError);
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
            : Array.isArray((profileData as any).values_array)
              ? (profileData as any).values_array
              : (profileData as any).values 
                ? [(profileData as any).values] 
                : (profileData as any).values_array
                  ? [(profileData as any).values_array]
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
        // No profile found, auto-create a default profile for this user
        // Note: getCurrentUserId already validated above
        const defaultProfile: Profile = {
          id: userId,
          user_id: userId,
          first_name: '',
          last_name: '',
          email: '',
          date_of_birth: '',
          gender: 'prefer_not_to_say',
          university: '',
          bio: '',
          interests: [],
          profile_images: [],
          subscription_tier: 'free',
          swipes_left: 10,
          pairing_requests_left: 3,
          blinddate_requests_left: 1,
          is_profile_public: true,
          verification_status: 'pending',
          total_qcs: 0,
        };
        // Save to backend
        await callDataFunction('update_profile', { profile: defaultProfile });
        setProfile(defaultProfile);
        console.log("🆕 Created default profile for user:", userId);
      }

      // Fetch preferences using data-management function
      const { data: prefData, error: prefError } = await callDataFunction('get_preferences');
      if (!prefError && prefData?.data?.preferences) {
        const safePrefs: PartnerPreferences = {
          ...prefData.data.preferences,
          preferred_gender: (prefData.data.preferences.preferred_gender || []) as Gender[],
        };
        setPreferences(safePrefs);
        console.log("📊 Preferences from data-management function:", safePrefs);
      } else {
        console.warn("⚠️ Preferences fetch failed, using localStorage fallback:", prefError);
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
    if (!userId) {
      toast({ title: 'Not authenticated', description: 'Please sign in to update your profile.', variant: 'destructive' });
      return;
    }

    try {
      // Keep all fields including arrays
      const dbUpdates: any = {
        ...updates,
        personality_type: updates.personality_traits?.[0] || undefined,
      };

      const { error: fnError } = await callDataFunction('update_profile', { profile: dbUpdates });
      if (fnError) throw fnError;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      try {
        await calculateQCS(userId);
      } catch (e) {
        console.warn("QCS recalculation failed:", e);
      }

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
    if (!userId) {
      toast({ title: 'Not authenticated', description: 'Please sign in to update preferences.', variant: 'destructive' });
      return;
    }
    
    try {
      const { error: fnError } = await callDataFunction('update_preferences', { preferences: updates });
      if (fnError) throw fnError;
      
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully.",
      });
      
      await fetchProfileData();
    } catch (error: any) {
      console.warn("⚠️ Falling back to localStorage for preferences:", error);
      // Fallback: store locally to keep UX smooth when function fails
      const current = localStorage.getItem('demoPreferences');
      const merged = { ...(current ? JSON.parse(current) : {}), user_id: userId, ...updates };
      localStorage.setItem('demoPreferences', JSON.stringify(merged));
      setPreferences(merged);
      toast({ title: "Preferences saved locally", description: "Changes will sync when connected.", });
    }
  };

  useEffect(() => {
    const uid = getCurrentUserId();
    if (!uid) {
      // No authenticated user yet; ensure local state is reset
      setIsLoading(false);
      setProfile(null);
      setPreferences(null);
      return;
    }

    // Fetch profile once we have a uid
    fetchProfileData();

    // Real-time updates for the current user
    const channel = supabase
      .channel(`profile-data-realtime-${uid}`)
      .on('postgres_changes', {
        schema: 'public',
        table: 'profiles',
        event: '*',
        filter: `user_id=eq.${uid}`
      }, () => {
        console.log('🔄 Own profile updated, refetching...');
        fetchProfileData();
      })
      .on('postgres_changes', {
        schema: 'public',
        table: 'partner_preferences',
        event: '*',
        filter: `user_id=eq.${uid}`
      }, () => {
        console.log('🔄 Preferences updated, refetching...');
        fetchProfileData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return {
    profile,
    preferences,
    isLoading,
    refetch: fetchProfileData,
    updateProfile,
    updatePreferences,
  };
};