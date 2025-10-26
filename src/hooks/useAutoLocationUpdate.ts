import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentLocation } from '@/utils/locationUtils';
import { updateUserLocation } from '@/services/profile';

const LOCATION_UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const LOCATION_UPDATE_KEY = 'last_location_update';

/**
 * Custom hook to automatically fetch and update user location
 * Runs when app opens and user is authenticated
 */
export const useAutoLocationUpdate = () => {
  const { user, isAuthenticated } = useAuth();
  const hasAttemptedUpdate = useRef(false);

  useEffect(() => {
    // Only run once per session and only for authenticated users
    if (!isAuthenticated || !user || hasAttemptedUpdate.current) {
      return;
    }

    const updateLocation = async () => {
      try {
        // Check when location was last updated
        const lastUpdate = localStorage.getItem(LOCATION_UPDATE_KEY);
        const lastUpdateTime = lastUpdate ? parseInt(lastUpdate, 10) : 0;
        const now = Date.now();
        
        // Only update if last update was more than LOCATION_UPDATE_INTERVAL ago
        if (now - lastUpdateTime < LOCATION_UPDATE_INTERVAL) {
          console.log('📍 Location was recently updated, skipping automatic update');
          return;
        }

        console.log('📍 Attempting automatic location update...');
        
        // Get current location silently
        const locationData = await getCurrentLocation();
        
        if (!locationData || !locationData.latitude || !locationData.longitude) {
          console.log('📍 No location data available');
          return;
        }

        console.log('📍 Location fetched:', {
          lat: locationData.latitude,
          lon: locationData.longitude,
          accuracy: locationData.accuracy,
        });

        // Get additional location details from reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'FlingzzApp/1.0'
            }
          }
        );

        if (!response.ok) {
          console.warn('📍 Reverse geocoding failed');
          // Still update with coordinates only
          await updateUserLocation({
            city: '',
            region: '',
            country: '',
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          });
          
          // Update timestamp
          localStorage.setItem(LOCATION_UPDATE_KEY, now.toString());
          console.log('✅ Location coordinates updated (without address details)');
          return;
        }

        const data = await response.json();
        
        const locationUpdate = {
          city: data.address?.city || data.address?.town || data.address?.village || '',
          region: data.address?.state || data.address?.county || '',
          country: data.address?.country || '',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        };

        console.log('📍 Location details:', locationUpdate);

        // Update user profile with new location
        const result = await updateUserLocation(locationUpdate);
        
        if (!result.error) {
          // Update timestamp on successful update
          localStorage.setItem(LOCATION_UPDATE_KEY, now.toString());
          console.log('✅ Location automatically updated successfully');
        } else {
          console.warn('📍 Failed to update location:', result.error);
        }
      } catch (error: any) {
        // Silently handle errors - don't show to user
        // Permission denied or other errors should not interrupt the app
        console.log('📍 Automatic location update failed:', error.message);
        
        // Don't retry for permission denied errors
        if (error.message?.includes('permission') || error.message?.includes('denied')) {
          console.log('📍 Location permission denied, will not retry automatically');
        }
      }
    };

    // Mark that we've attempted update for this session
    hasAttemptedUpdate.current = true;

    // Start the location update after a small delay to let the app settle
    const timeoutId = setTimeout(() => {
      updateLocation();
    }, 2000); // 2 second delay after app loads

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, user]);
};
