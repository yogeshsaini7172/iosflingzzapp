import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfileData } from "@/hooks/useProfileData";

export interface FeedProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  university: string;
  profile_images?: string[];
  bio?: string;
  total_qcs?: number;
  gender?: string;
}

export function useProfilesFeed() {
  const { profile, preferences } = useProfileData();
  const [profiles, setProfiles] = useState<FeedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const getCurrentUserId = () => {
    return localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
  };

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);

      try {
        const currentUserId = getCurrentUserId();
        
        // Fetch profiles excluding current user
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", currentUserId)
          .eq("is_active", true)
          .not("profile_images", "is", null)
          .limit(20);

        if (error) throw error;

        console.log("✅ Fetched profiles:", data?.length);
        setProfiles(data || []);
      } catch (err) {
        console.error("❌ Error fetching feed profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []); // Remove dependency on profile/preferences for now

  return { profiles, loading, setProfiles };
}
