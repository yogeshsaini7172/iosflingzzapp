import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfileData } from "@/hooks/useProfileData";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";

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
    if (!user?.uid) {
      throw new Error('User authentication required for profiles feed');
    }
    return user.uid;
  };

  const fetchFeed = async () => {
    setLoading(true);

    try {
      const currentUserId = getCurrentUserId();
      console.log('🔄 fetchFeed called for user:', currentUserId);
      
      // Use data-management function with real Firebase token
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/data-management', {
        method: 'POST',
        body: JSON.stringify({
          action: 'get_feed',
          user_id: currentUserId,
          limit: 20
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("❌ Error calling data-management (get_feed):", err);
        throw new Error(err?.error || 'Failed to fetch feed');
      }

      const payload = await response.json();
      console.log("✅ Full response payload:", payload);
      console.log("✅ Fetched profiles:", payload?.data?.profiles?.length);
      console.log("📦 Profile data sample:", payload?.data?.profiles?.[0]);
      
      setProfiles(payload?.data?.profiles || []);
    } catch (err) {
      console.error("💥 Error fetching feed profiles:", err);
      setProfiles([]); // Clear profiles on error
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