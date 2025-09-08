import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
import { Profile } from "@/hooks/useProfileData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const usePairing = () => {
  const [pairedProfiles, setPairedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const getCurrentUserId = () => {
    if (!user?.uid) {
      throw new Error('User authentication required for pairing');
    }
    return user.uid;
  };

  const fetchPairedProfiles = async () => {
    const userId = getCurrentUserId();

    try {
      setLoading(true);

      // Use data-management function for pairing feed
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/data-management', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'get_pairing_feed',
          limit: 10,
          filters: {
            ageMin: 18,
            ageMax: 30
          }
        })
      });

      if (!response.ok) throw new Error('Failed to fetch pairing feed');
      const data = await response.json();

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

    // Realtime: refetch when profiles or enhanced_matches change
    const channel = supabase
      .channel('pairing-feed-realtime')
      .on('postgres_changes', { schema: 'public', table: 'profiles', event: '*' }, () => {
        fetchPairedProfiles();
      })
      .on('postgres_changes', { schema: 'public', table: 'enhanced_matches', event: '*' }, () => {
        fetchPairedProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    pairedProfiles,
    loading,
    refetch: fetchPairedProfiles,
  };
};