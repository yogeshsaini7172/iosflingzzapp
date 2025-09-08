import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Profile = {
  profile_id: string;
  user_id: string;
  display_name: string;
  age: number;
  gender: string;
  location?: string;
  bio?: string;
  interests?: string[] | null;
  photos?: any;
  created_at: string;
};

export function useFeed(initialLimit = 12) {
  const [items, setItems] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { accessToken } = useAuth();

  const fetchNext = useCallback(
    async (limit = initialLimit, filters: { ageMin?: number; ageMax?: number; gender?: string } = {}) => {
      if (loading) return;
      setLoading(true);
      
      try {
        const last = items[items.length - 1];
        const cursor = last ? last.created_at : undefined;
        
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        if (cursor) params.set("cursor", cursor);
        if (filters.ageMin) params.set("age_min", String(filters.ageMin));
        if (filters.ageMax) params.set("age_max", String(filters.ageMax));
        if (filters.gender && filters.gender !== "all") params.set("gender", filters.gender);
        
        // Get Firebase token
        const token = accessToken;
        
        // Call the Supabase Edge Function
        const { data: response, error } = await supabase.functions.invoke('get-feed', {
          body: Object.fromEntries(params.entries()),
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        if (error) throw error;
        
        const newData: Profile[] = response?.data || [];
        const hasMoreData = response?.hasMore || false;
        
        console.log(`📥 Fetched ${newData.length} profiles, hasMore: ${hasMoreData}`);
        
        if (newData.length < limit) setHasMore(false);
        else setHasMore(hasMoreData);
        
        setItems((prev) => [...prev, ...newData]);
      } catch (err) {
        console.error("❌ Fetch feed error:", err);
      } finally {
        setLoading(false);
      }
    },
    [initialLimit, items, loading]
  );

  const refresh = useCallback(async (filters: { ageMin?: number; ageMax?: number; gender?: string } = {}) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.set("limit", String(initialLimit));
      if (filters.ageMin) params.set("age_min", String(filters.ageMin));
      if (filters.ageMax) params.set("age_max", String(filters.ageMax));
      if (filters.gender && filters.gender !== "all") params.set("gender", filters.gender);
      
      // Get Firebase token
      const token = accessToken;
      
      // Call the Supabase Edge Function
      const { data: response, error } = await supabase.functions.invoke('get-feed', {
        body: Object.fromEntries(params.entries()),
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (error) throw error;
      
      const newData: Profile[] = response?.data || [];
      const hasMoreData = response?.hasMore || false;
      
      console.log(`🔄 Refreshed with ${newData.length} profiles`);
      
      setItems(newData);
      setHasMore(hasMoreData);
    } catch (err) {
      console.error("❌ Refresh feed error:", err);
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  // Optimistic remove item after swipe (like/pass)
  const removeItem = useCallback((profileId: string) => {
    setItems((prev) => prev.filter((p) => p.profile_id !== profileId));
  }, []);

  const swipeProfile = useCallback(async (profileId: string, userId: string, type: "like" | "pass") => {
    try {
      // Get Firebase token
      const token = accessToken;
      
      // Call the swipe Edge Function
      const { data: response, error } = await supabase.functions.invoke('swipe', {
        body: { to_user_id: userId, type, from_user_id: userId },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (error) throw error;
      
      console.log(`✅ Swiped ${type} on profile ${profileId}`, response);
      
      // Optimistically remove from feed
      removeItem(profileId);
      
      return response;
    } catch (err) {
      console.error("❌ Swipe error:", err);
      throw err;
    }
  }, [removeItem, accessToken]);

  return {
    items,
    loading,
    hasMore,
    fetchNext,
    refresh,
    removeItem,
    swipeProfile,
    setItems,
  };
}