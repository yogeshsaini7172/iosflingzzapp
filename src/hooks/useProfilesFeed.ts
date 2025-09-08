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

  const getCurrentUserId = () => {
    if (user?.uid) {
      return user.uid;
    }
    return localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
  };

  const fetchFeed = async () => {
    setLoading(true);

    try {
      const currentUserId = getCurrentUserId();
      
      // Use data-management function for feed
      const { data, error } = await supabase.functions.invoke('data-management', {
        headers: { Authorization: `Bearer firebase-${currentUserId}` },
        body: { 
          action: 'get_feed',
          user_id: currentUserId,
          limit: 20
        }
      });

      if (error) throw error;

      console.log("✅ Fetched profiles from data-management:", data?.data?.profiles?.length);
      setProfiles(data?.data?.profiles || []);
    } catch (err) {
      console.error("❌ Error fetching feed profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();

    // Real-time updates for profiles feed
    const channel = supabase
      .channel('profiles-feed-realtime')
      .on('postgres_changes', { schema: 'public', table: 'profiles', event: '*' }, () => {
        console.log('🔄 Profile updated, refetching feed...');
        fetchFeed();
      })
      .on('postgres_changes', { schema: 'public', table: 'enhanced_swipes', event: '*' }, () => {
        console.log('🔄 New swipe detected, refetching feed...');
        fetchFeed();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { profiles, loading, setProfiles };
}