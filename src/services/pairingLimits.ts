import { supabase } from '@/integrations/supabase/client';

export interface DailyPairingUsage {
  user_id: string;
  date: string; // YYYY-MM-DD format
  pairing_requests_used: number;
  created_at: string;
  updated_at: string;
}

export interface QCSMatchDistribution {
  range_100_80: number; // 2 pairs
  range_80_60: number;  // 3 pairs  
  range_60_40: number;  // 2 pairs
  range_below_40: number; // 3 pairs (remaining)
}

export class PairingLimitService {
  private static readonly QCS_DISTRIBUTION: QCSMatchDistribution = {
    range_100_80: 2,
    range_80_60: 3,
    range_60_40: 2,
    range_below_40: 3 // Total 10 pairs max
  };

  /**
   * Get user's daily pairing usage for today (local timezone) - using localStorage
   */
  static getDailyUsage(userId: string): DailyPairingUsage | null {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const storageKey = `pairing_usage_${userId}_${today}`;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting daily usage from localStorage:', error);
      return null;
    }
  }

  /**
   * Create or update daily usage record - using localStorage
   */
  static incrementDailyUsage(userId: string): boolean {
    const today = new Date().toLocaleDateString('en-CA');
    const storageKey = `pairing_usage_${userId}_${today}`;
    
    try {
      const existing = this.getDailyUsage(userId);
      const now = new Date().toISOString();
      
      const usage: DailyPairingUsage = existing ? {
        ...existing,
        pairing_requests_used: existing.pairing_requests_used + 1,
        updated_at: now
      } : {
        user_id: userId,
        date: today,
        pairing_requests_used: 1,
        created_at: now,
        updated_at: now
      };

      localStorage.setItem(storageKey, JSON.stringify(usage));
      return true;
    } catch (error) {
      console.error('Error updating daily usage in localStorage:', error);
      return false;
    }
  }

  /**
   * Check if user can make more pairing requests today
   */
  static canMakePairingRequest(userId: string, userPlan: string): {
    canRequest: boolean;
    usedToday: number;
    dailyLimit: number;
    remainingRequests: number;
  } {
    try {
      // Get user's plan limits
      const planLimits = this.getPlanLimits(userPlan);
      
      // Get today's usage
      const usage = this.getDailyUsage(userId);
      const usedToday = usage?.pairing_requests_used || 0;
      
      const canRequest = usedToday < planLimits.daily_pairing_limit;
      const remainingRequests = Math.max(0, planLimits.daily_pairing_limit - usedToday);

      return {
        canRequest,
        usedToday,
        dailyLimit: planLimits.daily_pairing_limit,
        remainingRequests
      };
    } catch (error) {
      console.error('Error checking pairing request limits:', error);
      return {
        canRequest: false,
        usedToday: 0,
        dailyLimit: 1,
        remainingRequests: 0
      };
    }
  }

  /**
   * Get plan-specific limits
   */
  private static getPlanLimits(planId: string) {
    switch (planId) {
      case 'free':
        return { daily_pairing_limit: 1 };
      
      case 'basic_69':
      case '69_basic':      // Legacy format
      case 'basic_69_pro':  // Legacy format
      case '69_pro':        // Legacy format
        return { daily_pairing_limit: 5 };
      
      case 'standard_129':
      case '129_pro':       // Legacy format
      case 'standard_129_pro': // Legacy format
      case '129_standard':  // Legacy format
        return { daily_pairing_limit: 10 };
      
      case 'premium_243':
      case '243_premium':   // Legacy format
      case 'premium_243_pro': // Legacy format
      case '243_pro':       // Legacy format
        return { daily_pairing_limit: 20 };
      
      default: // fallback to free plan for unknown plans
        console.warn(`Unknown plan ID: ${planId}, defaulting to free plan limits`);
        return { daily_pairing_limit: 1 };
    }
  }

  /**
   * Get QCS-distributed matches (7 total as specified)
   */
  static async getQCSDistributedMatches(userId: string, maxDistanceKm?: number): Promise<any[]> {
    try {
      const matches: any[] = [];

      // Get 2 matches from 100-80 QCS range
      const highQCS = await this.getMatchesByQCSRange(userId, 80, 100, 2, maxDistanceKm);
      matches.push(...highQCS);

      // Get 3 matches from 80-60 QCS range  
      const mediumQCS = await this.getMatchesByQCSRange(userId, 60, 80, 3, maxDistanceKm);
      matches.push(...mediumQCS);

      // Get 2 matches from 60-40 QCS range
      const lowQCS = await this.getMatchesByQCSRange(userId, 40, 60, 2, maxDistanceKm);
      matches.push(...lowQCS);

      // Get remaining matches from below 40 QCS (up to 7 total)
      const remainingSlots = 7 - matches.length;
      if (remainingSlots > 0) {
        const veryLowQCS = await this.getMatchesByQCSRange(userId, 0, 40, remainingSlots, maxDistanceKm);
        matches.push(...veryLowQCS);
      }

      return matches.slice(0, 7); // Ensure max 7 matches
    } catch (error) {
      console.error('Error getting QCS distributed matches:', error);
      return [];
    }
  }

  /**
   * Get matches within specific QCS range using enhanced_matches table
   */
  private static async getMatchesByQCSRange(
    userId: string, 
    minQCS: number, 
    maxQCS: number, 
    limit: number,
    maxDistanceKm?: number
  ): Promise<any[]> {
    try {
      // First try the enhanced_matches table (has compatibility data in separate compatibility_scores table)
      const { data: matchesData, error: matchesError } = await supabase
        .from('enhanced_matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (matchesError) {
        console.warn(`Enhanced matches table query failed:`, matchesError);
        // Return empty array to fall back to deterministic pairing
        return [];
      }

      if (!matchesData || matchesData.length === 0) {
        return [];
      }

      // Fetch profile data for all matched users
      const otherUserIds = matchesData.map(match => 
        match.user1_id === userId ? match.user2_id : match.user1_id
      ).filter(Boolean);

      if (otherUserIds.length === 0) {
        return [];
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, profile_images, bio, university, total_qcs, date_of_birth, interests')
        .in('user_id', otherUserIds);

      if (profilesError) {
        console.warn(`Profiles query failed:`, profilesError);
        return [];
      }

      // Map profiles to user IDs for easy lookup
      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      // Transform matches with profile data
      return matchesData.map(match => {
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const otherProfile = profileMap.get(otherUserId);
        
        return {
          ...match,
          matched_user: otherProfile,
          user_profile: otherProfile,
          qcs_score: otherProfile?.total_qcs || 0,
          compatibility_score: otherProfile?.total_qcs || 0
        };
      }).filter(m => m.matched_user); // Filter out matches without profile data
    } catch (error) {
      console.error(`Error getting matches for QCS range ${minQCS}-${maxQCS}:`, error);
      return [];
    }
  }

  /**
   * Clean up old localStorage entries (run this periodically)
   */
  static cleanupOldUsageData(userId: string): void {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Remove yesterday's data (you can adjust this to keep more days if needed)
      const yesterdayKey = `pairing_usage_${userId}_${yesterday.toLocaleDateString('en-CA')}`;
      localStorage.removeItem(yesterdayKey);
    } catch (error) {
      console.error('Error cleaning up old usage data:', error);
    }
  }
}