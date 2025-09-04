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
      toast({
        title: "Error loading matches",
        description: error.message,
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