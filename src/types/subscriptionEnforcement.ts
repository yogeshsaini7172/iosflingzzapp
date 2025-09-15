export interface ErrorResponse {
  error?: string;
  message?: string;
  details?: string;
}

export interface PlanLimits {
  daily_swipes: number;
  total_swipes: number;
  can_see_who_liked_you: boolean;
  can_see_mutual_friends: boolean;
  can_use_filters: boolean;
  extra_pairings_left: number;
  plan: string;
}

export interface EnhancedSwipeResponse {
  success: boolean;
  matched?: boolean;
  matchId?: string;
  chatRoomId?: string;
  error?: string;
  message?: string;
}

export interface SwipeData {
  direction: 'left' | 'right';
  daily_swipes_used: number;
  daily_swipes_remaining: number | null;
  unlimited: boolean;
  plan: string;
  isMatch?: boolean;
  matchId?: string;
  chatRoomId?: string;
}

export interface SwipeResult {
  success: boolean;
  data?: SwipeData;
  error?: string;
  limit_info?: {
    limit: number;
    used: number;
    plan: string;
  };
}