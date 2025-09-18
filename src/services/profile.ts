import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';

export interface LocationUpdate {
  city: string;
  region: string;
  country: string;
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
