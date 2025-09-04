import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/hooks/useProfileData";
import { useToast } from "@/hooks/use-toast";

export const usePairing = () => {
  const [pairedProfiles, setPairedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getCurrentUserId = () => {
    return localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
  };

  const fetchPairedProfiles = async () => {
    const userId = getCurrentUserId();

    try {
      setLoading(true);

      // Call the pairing-matches function
      const { data, error } = await supabase.functions.invoke("pairing-matches", {
        body: { user_id: userId, limit: 10 }
      });

      if (error) throw error;

      setPairedProfiles(data?.matches || []);
    } catch (error: any) {
      console.error("❌ Error fetching paired profiles:", error);
      // Friendly fallback: show suggested profiles if pairing limit reached or function fails
      try {
        const { data: fallback } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", userId)
          .eq("is_active", true)
          .limit(10);
        setPairedProfiles(fallback as Profile[] || []);
        toast({
          title: "Showing suggested profiles",
          description: "Pairing limit reached or temporarily unavailable.",
        });
      } catch (fallbackErr) {
        toast({
          title: "Error loading matches",
          description: (error as any)?.message || "Please try again later.",
          variant: "destructive",
        });
      }
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