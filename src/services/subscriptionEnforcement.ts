import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';

interface SwipeResult {
  success: boolean;
  data?: {
    direction: 'left' | 'right';
    daily_swipes_used: number;
    daily_swipes_remaining: number | null;
    unlimited: boolean;
    plan: string;
  };
  error?: string;
  limit_info?: {
    limit: number;
    used: number;
    plan: string;
  };
}

interface FeedResult {
  success: boolean;
  data?: {
    unlocked: any[];
    locked_count: number;
    plan_info: {
      id: string;
      base_profiles_shown: number;
      extra_pairings_left: number;
      total_unlocked: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
  error?: string;
}

interface WhoLikedMeResult {
  success: boolean;
  data?: {
    count: number;
    mutual_matches_count: number;
    users: Array<{
      user_id: string;
      first_name: string;
      last_name: string;
      age: number;
      university: string;
      profile_images: string[];
      bio: string;
      interests: string[];
      total_qcs: number;
      gender: string;
      liked_at: string;
      is_mutual_match: boolean;
    }>;
    plan_info: {
      id: string;
      can_see_who_liked_you: boolean;
    };
  };
  error?: string;
  plan_info?: {
    id: string;
    can_see_who_liked_you: boolean;
    upgrade_required?: boolean;
  };
}

export class SubscriptionEnforcementService {
  /**
   * Process a swipe action with plan enforcement
   */
  static async processSwipe(candidateId: string, direction: 'left' | 'right'): Promise<SwipeResult> {
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/swipe-enforcement', {
        method: 'POST',
        body: JSON.stringify({
          candidate_id: candidateId,
          direction
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to process swipe' };
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Error processing swipe:', err);
      return { success: false, error: err.message || 'Failed to process swipe' };
    }
  }

  /**
   * Get pairing feed with plan-based unlocking
   */
  static async getPairingFeed(page: number = 1, limit: number = 20): Promise<FeedResult> {
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/pairing-feed-enhanced', {
        method: 'POST',
        body: JSON.stringify({
          page,
          limit
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to get pairing feed' };
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Error getting pairing feed:', err);
      return { success: false, error: err.message || 'Failed to get pairing feed' };
    }
  }

  /**
   * Request extra pairings (consumes user's extra pairing allowance)
   */
  static async requestExtraPairings(count: number = 1): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/request-extra-pairings', {
        method: 'POST',
        body: JSON.stringify({ count })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to request extra pairings' };
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Error requesting extra pairings:', err);
      return { success: false, error: err.message || 'Failed to request extra pairings' };
    }
  }

  /**
   * Get list of users who liked the current user
   */
  static async getWhoLikedMe(): Promise<WhoLikedMeResult> {
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/who-liked-me', {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to get who liked you' };
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Error getting who liked me:', err);
      return { success: false, error: err.message || 'Failed to get who liked you' };
    }
  }

  /**
   * Check if user can perform an action based on their plan
   */
  static async checkActionPermission(action: 'swipe' | 'see_who_liked' | 'request_extra_pairings'): Promise<boolean> {
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/subscription-entitlement', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (!data.success) {
        return false;
      }

      const { features, limits } = data.data;

      switch (action) {
        case 'swipe':
          return limits.daily_swipes.unlimited || limits.daily_swipes.used < limits.daily_swipes.limit;
        
        case 'see_who_liked':
          return features.can_see_who_liked_you;
        
        case 'request_extra_pairings':
          return features.can_request_extra_pairings && limits.profiles_shown.extra_pairings_left > 0;
        
        default:
          return false;
      }
    } catch (err: any) {
      console.error('Error checking action permission:', err);
      return false;
    }
  }

  /**
   * Get plan-specific limits for display in UI
   */
  static async getPlanLimits(): Promise<any> {
    try {
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/subscription-entitlement', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.success) {
        return null;
      }

      return data.data.limits;
    } catch (err: any) {
      console.error('Error getting plan limits:', err);
      return null;
    }
  }
}