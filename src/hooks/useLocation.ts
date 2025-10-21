import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateUserLocation } from '@/services/profile';
import { getCurrentLocation } from '@/utils/locationUtils';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  address?: string;
  accuracy?: number;
  source: 'geolocation' | 'ip' | 'manual';
}

export interface LocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export const useLocation = (autoFetch: boolean = false) => {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    hasPermission: false,
    permissionStatus: 'unknown'
  });

  const { toast } = useToast();

  const reverseGeocode = async (lat: number, lon: number): Promise<{
    city?: string;
    region?: string;
    country?: string;
    address?: string;
  }> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      return {
        city: data.address?.city || data.address?.town || data.address?.village,
        region: data.address?.state || data.address?.county,
        country: data.address?.country,
        address: data.display_name
      };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return {};
    }
  };

  const checkPermissionStatus = useCallback(async () => {
    // If running in native Capacitor runtime, check plugin permissions first
    try {
      // @ts-ignore
      const win: any = typeof window !== 'undefined' ? window : {};
      const isCapacitorPlatform = Boolean(
        win.Capacitor && (
          (typeof win.Capacitor.getPlatform === 'function' && win.Capacitor.getPlatform() !== 'web') ||
          win.Capacitor.isNative || win.Capacitor.isNativePlatform
        )
      );

      if (isCapacitorPlatform) {
        try {
          // @ts-ignore
          const capModName = '@' + 'capacitor/geolocation';
          // @ts-ignore
          const cap: any = await import(/* @vite-ignore */ capModName);
          const { Geolocation } = cap || {};
          if (Geolocation && typeof Geolocation.checkPermissions === 'function') {
            const permRes = await Geolocation.checkPermissions();
            const finalPerm = permRes?.location || permRes?.locationAlways || permRes?.locationWhenInUse;
            setState(prev => ({
              ...prev,
              permissionStatus: finalPerm === 'granted' ? 'granted' : (finalPerm === 'denied' ? 'denied' : 'prompt'),
              hasPermission: finalPerm === 'granted'
            }));
            return finalPerm;
          }
        } catch (err) {
          console.debug('Capacitor permission check failed', err);
        }
      }

      if (!navigator.geolocation) {
        setState(prev => ({ ...prev, permissionStatus: 'denied' }));
        return 'denied';
      }

      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ 
          ...prev, 
          permissionStatus: permission.state as any,
          hasPermission: permission.state === 'granted'
        }));
        return permission.state;
      } catch {
        setState(prev => ({ ...prev, permissionStatus: 'unknown' }));
        return 'unknown';
      }
    } catch (outerErr) {
      console.debug('checkPermissionStatus outer error', outerErr);
      setState(prev => ({ ...prev, permissionStatus: 'unknown' }));
      return 'unknown';
    }
  }, []);

  // ...native permission helpers moved below so they can reference other helpers

  const fetchLocationWithPermission = useCallback(async (): Promise<LocationData | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Try geolocation - this will trigger browser's native permission dialog
      const locationData = await getCurrentLocation();
      
      // Get address information
      const addressInfo = await reverseGeocode(locationData.latitude, locationData.longitude);
      
      const fullLocationData: LocationData = {
        ...locationData,
        ...addressInfo,
        source: 'geolocation' as const
      };

      setState(prev => ({ 
        ...prev, 
        location: fullLocationData, 
        isLoading: false,
        hasPermission: true,
        permissionStatus: 'granted',
        error: null // Clear any previous errors
      }));

      return fullLocationData;
    } catch (error: any) {
      console.warn('Geolocation failed:', error.message);
      
      // Update permission status based on error but continue trying
      if (error.message?.includes('denied') || error.message?.includes('permission')) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          permissionStatus: 'denied',
          hasPermission: false,
          error: 'Location permission needed - browser popup will appear'
        }));
        throw new Error('Location permission denied');
      }
      
      // For other errors, still report failure
      const errorMessage = 'Unable to determine your location. Retrying...';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false,
        permissionStatus: 'denied'
      }));
      throw new Error(errorMessage);
    }
  }, []);

  const saveLocationToProfile = useCallback(async (locationData: LocationData) => {
    try {
      const locationUpdate = {
        city: locationData.city || '',
        region: locationData.region || '',
        country: locationData.country || '',
        latitude: locationData.latitude,
        longitude: locationData.longitude
      };

      const result = await updateUserLocation(locationUpdate);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Location saved",
        description: "Your location has been updated in your profile",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Failed to save location",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const requestLocation = useCallback(async (saveToProfile: boolean = true) => {
    try {
      const locationData = await fetchLocationWithPermission();
      
      if (locationData && saveToProfile) {
        await saveLocationToProfile(locationData);
      }
      
      return locationData;
    } catch (error: any) {
      console.warn('Location request failed:', error.message);
      // Don't show toast for permission denied during automatic requests
      if (!error.message?.includes('denied')) {
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive",
        });
      }
      throw error;
    }
  }, [fetchLocationWithPermission, saveLocationToProfile, toast]);

  const clearLocation = useCallback(() => {
    setState({
      location: null,
      isLoading: false,
      error: null,
      hasPermission: false,
      permissionStatus: 'unknown'
    });
  }, []);

  const setManualLocation = useCallback(async (city: string, region: string, country: string, saveToProfile: boolean = true) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Geocode the manual location
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${city}, ${region}, ${country}`)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const manualLocationData: LocationData = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          city,
          region,
          country,
          address: data[0].display_name,
          source: 'manual' as const
        };

        setState(prev => ({ 
          ...prev, 
          location: manualLocationData, 
          isLoading: false 
        }));

        if (saveToProfile) {
          await saveLocationToProfile(manualLocationData);
        }

        return manualLocationData;
      } else {
        throw new Error('Location not found');
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: `Failed to set manual location: ${error.message}`, 
        isLoading: false 
      }));
      return null;
    }
  }, [saveLocationToProfile]);

  // Auto-fetch location on mount if requested
  useEffect(() => {
    if (autoFetch && !state.location && !state.isLoading) {
      // Automatically try to get location - this will trigger browser popup
      const autoGetLocation = async () => {
        try {
          console.log('📍 Auto-requesting location permission...');
          const locationData = await fetchLocationWithPermission();
          if (locationData) {
            await saveLocationToProfile(locationData);
          }
        } catch (error: any) {
          console.log('Auto location fetch failed:', error.message);
          // Set appropriate error state
          setState(prev => ({ 
            ...prev, 
            error: error.message || 'Unable to determine location automatically',
            permissionStatus: error.message?.includes('denied') ? 'denied' : 'prompt'
          }));
        }
      };
      
      // Small delay to ensure component is mounted, then trigger request
      const timer = setTimeout(() => {
        autoGetLocation();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [autoFetch, state.location, state.isLoading, fetchLocationWithPermission, saveLocationToProfile]);

  // Request native permissions explicitly (Capacitor) from UI
  const requestNativePermissions = useCallback(async (): Promise<boolean> => {
    try {
      // @ts-ignore
      const win: any = typeof window !== 'undefined' ? window : {};
      const isCapacitorPlatform = Boolean(
        win.Capacitor && (
          (typeof win.Capacitor.getPlatform === 'function' && win.Capacitor.getPlatform() !== 'web') ||
          win.Capacitor.isNative || win.Capacitor.isNativePlatform
        )
      );

      if (!isCapacitorPlatform) {
        return false;
      }

      try {
        // @ts-ignore
        const capModName = '@' + 'capacitor/geolocation';
        // @ts-ignore
        const cap: any = await import(/* @vite-ignore */ capModName);
        const { Geolocation } = cap || {};
        if (!Geolocation) throw new Error('Capacitor Geolocation plugin not available');

        // Request permissions
        if (typeof Geolocation.requestPermissions === 'function') {
          await Geolocation.requestPermissions();
        } else if (typeof Geolocation.requestPermission === 'function') {
          // older or different APIs
          await Geolocation.requestPermission();
        }

        // Re-check
        if (typeof Geolocation.checkPermissions === 'function') {
          const perm = await Geolocation.checkPermissions();
          const finalPerm = perm?.location || perm?.locationAlways || perm?.locationWhenInUse;
          setState(prev => ({ ...prev, permissionStatus: finalPerm === 'granted' ? 'granted' : 'denied', hasPermission: finalPerm === 'granted' }));
          return finalPerm === 'granted';
        }

        // If we can't check, assume success
        setState(prev => ({ ...prev, permissionStatus: 'granted', hasPermission: true }));
        return true;
      } catch (err: any) {
        console.warn('requestNativePermissions failed', err);
        setState(prev => ({ ...prev, permissionStatus: 'denied', hasPermission: false }));
        return false;
      }
    } catch (err) {
      console.debug('requestNativePermissions outer error', err);
      return false;
    }
  }, []);

  // Ensure permission and then fetch location (helps auto-prompt on login)
  const ensurePermissionAndFetchLocation = useCallback(async (saveToProfile: boolean = true) => {
    try {
      // Try native request first
      const nativeRequested = await requestNativePermissions();
      if (nativeRequested) {
        const loc = await fetchLocationWithPermission();
        if (loc && saveToProfile) await saveLocationToProfile(loc);
        return loc;
      }

      // Fallback to web flow
      const perm = await checkPermissionStatus();
      if (perm === 'granted' || perm === 'prompt') {
        const loc = await fetchLocationWithPermission();
        if (loc && saveToProfile) await saveLocationToProfile(loc);
        return loc;
      }

      throw new Error('Permission not granted');
    } catch (err) {
      console.warn('ensurePermissionAndFetchLocation failed', err);
      throw err;
    }
  }, [requestNativePermissions, fetchLocationWithPermission, saveLocationToProfile, checkPermissionStatus]);

  return {
    ...state,
    requestLocation,
    clearLocation,
    setManualLocation,
    saveLocationToProfile,
    checkPermissionStatus,
    fetchLocationWithPermission
  };
};