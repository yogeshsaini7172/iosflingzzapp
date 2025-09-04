import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfileData } from "@/hooks/useProfileData";
import { useAuth } from "@/contexts/AuthContext";

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
  interests?: string[];
  relationship_goals?: string[];
}

export function useProfilesFeed() {
  const { profile, preferences } = useProfileData();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<FeedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Fetch profiles excluding current user
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", user.id)
          .eq("is_active", true)
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

    if (user) {
      fetchFeed();
    }
  }, [user]);

  return { profiles, loading, setProfiles };
}
