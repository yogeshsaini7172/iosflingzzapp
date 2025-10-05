import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';

export interface LocationUpdate {
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

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
  height?: number;
  body_type?: string;
  face_type?: string;
  personality_type?: string;
  lifestyle?: string;
  values?: string[];
  love_language?: string;
  humor_type?: string;
  interests?: string[];
  relationship_goals?: string[];
  latitude?: number;
  longitude?: number;
}

export async function updateUserLocation(location: LocationUpdate): Promise<{ error?: any }> {
  try {
    const response = await fetchWithFirebaseAuth('/functions/v1/profile-management', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update',
        profile: {
          location: JSON.stringify(location),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || 'Failed to update location' };
    }

    return {};
  } catch (error) {
    return { error };
  }
}

export async function fetchProfilesFeed(limit: number = 20): Promise<{ profiles?: FeedProfile[]; error?: any }> {
  try {
    const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/data-management', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_feed',
        limit,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error || 'Failed to fetch profiles feed' };
    }

    const data = await response.json();
    return { profiles: data.data?.profiles || [] };
  } catch (error) {
    return { error };
  }
}
