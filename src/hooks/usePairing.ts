import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/hooks/useProfileData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const usePairing = () => {
  const [pairedProfiles, setPairedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const getCurrentUserId = () => {
    if (user?.uid) {
      return user.uid;
    }
    return localStorage.getItem("demoUserId") || "11111111-1111-1111-1111-111111111001";
  };

  const fetchPairedProfiles = async () => {
    const userId = getCurrentUserId();

    try {
      setLoading(true);

      // Use data-management function for pairing feed
      const { data, error } = await supabase.functions.invoke("data-management", {
        headers: { Authorization: `Bearer firebase-${userId}` },
        body: { 
          action: 'get_pairing_feed',
          user_id: userId, 
          limit: 10,
          filters: {
            ageMin: 18,
            ageMax: 30
          }
        }
      });

      if (error) throw error;

      const profiles = (data?.data?.profiles || []).map((profile: any) => ({
        ...profile,
        personality_traits: Array.isArray(profile.personality_traits) 
          ? profile.personality_traits 
          : profile.personality_type 
            ? [profile.personality_type] 
            : [],
        values: Array.isArray(profile.values) 
          ? profile.values 
          : profile.values 
            ? [profile.values] 
            : [],
        mindset: Array.isArray(profile.mindset) 
          ? profile.mindset 
          : profile.mindset 
            ? [profile.mindset] 
            : [],
      })) as Profile[];

      setPairedProfiles(profiles);
      console.log("✅ Pairing profiles fetched:", profiles.length);
    } catch (error: any) {
      console.error("❌ Error fetching paired profiles:", error);
      toast({
        title: "Error loading matches",
        description: (error as any)?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPairedProfiles();
  }, []);

  return {
    pairedProfiles,
    loading,
    refetch: fetchPairedProfiles,
  };
};