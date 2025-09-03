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

  useEffect(() => {
    const fetchFeed = async () => {
      if (!profile || !preferences) return;

      setLoading(true);

      try {
        let query = supabase.from("profiles").select("*");

        // 🚫 Exclude current user
        query = query.neq("user_id", profile.user_id);

        // ✅ Gender filter
        if (preferences.preferred_gender?.length > 0) {
          query = query.in("gender", preferences.preferred_gender);
        }

        // ✅ Age filter (calculate from DOB)
        if (preferences.age_range_min && preferences.age_range_max) {
          const currentYear = new Date().getFullYear();
          const minYear = currentYear - preferences.age_range_max;
          const maxYear = currentYear - preferences.age_range_min;

          query = query.gte("date_of_birth", `${minYear}-01-01`);
          query = query.lte("date_of_birth", `${maxYear}-12-31`);
        }

        // 🎯 Fetch 20 candidate profiles
        const { data, error } = await query.limit(20);
        if (error) throw error;

        setProfiles(data || []);
      } catch (err) {
        console.error("❌ Error fetching feed profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [profile, preferences]);

  return { profiles, loading, setProfiles };
}
