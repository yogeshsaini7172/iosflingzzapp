export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: string;
}


export const getCurrentLocation = async (): Promise<LocationData> => {
  // If running inside Capacitor native runtime, prefer Capacitor Geolocation
  try {
    // Detect Capacitor/native runtime robustly without importing plugin on web
    // @ts-ignore
    const win: any = typeof window !== 'undefined' ? window : {};
    const isCapacitorPlatform = Boolean(
      win.Capacitor && (
        // modern Capacitor exposes getPlatform()
        (typeof win.Capacitor.getPlatform === 'function' && win.Capacitor.getPlatform() !== 'web') ||
        // legacy flag
        win.Capacitor.isNative || win.Capacitor.isNativePlatform
      )
    );

    if (isCapacitorPlatform) {
      try {
        // Import dynamically using a computed string to avoid bundler static resolution
        // @ts-ignore
        const capModName = '@' + 'capacitor/geolocation';
        // @ts-ignore
        const cap: any = await import(/* @vite-ignore */ capModName);
        const { Geolocation } = cap || {};

        if (!Geolocation) {
          throw new Error('Capacitor Geolocation plugin not found');
        }

        // Check current permission state
        let permRes: any = {};
        try {
          permRes = await Geolocation.checkPermissions();
        } catch (permErr) {
          // Some plugin versions expose requestPermissions only
          console.debug('Geolocation.checkPermissions not available or failed', permErr);
        }

        const locationPermState = permRes?.location || permRes?.locationAlways || permRes?.locationWhenInUse;

        // If not granted, request permissions
        if (!locationPermState || (locationPermState !== 'granted' && locationPermState !== 'prompt')) {
          try {
            await Geolocation.requestPermissions();
          } catch (reqErr) {
            console.warn('Capacitor permission request failed', reqErr);
          }

          // Re-check
          try {
            permRes = await Geolocation.checkPermissions();
          } catch (permErr2) {
            console.debug('Second checkPermissions failed', permErr2);
          }
        }

        const finalPerm = permRes?.location || permRes?.locationAlways || permRes?.locationWhenInUse;
        if (finalPerm === 'denied') {
          throw new Error('Location permission denied by user (native)');
        }

        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'Capacitor Geolocation'
        };
      } catch (capErr: any) {
        console.warn('Capacitor Geolocation flow failed:', capErr?.message || capErr);
        // If Capacitor fails, fall through to web behavior
      }
    }
  } catch (e) {
    // Non-fatal - continue to try navigator.geolocation
    console.debug('Capacitor runtime detection/import failed', e);
  }

  // Web fallback: navigator.geolocation
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this platform'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'Geolocation API'
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message, 'Code:', error.code);

        if (error.code === 1) { // PERMISSION_DENIED
          reject(new Error('Location permission denied by user'));
          return;
        }

        reject(new Error(`Geolocation failed: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

const fetchLocationFromIP = async (): Promise<LocationData> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    if (!data.latitude || !data.longitude) {
      throw new Error('Invalid IP location data');
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      source: 'IP-based lookup',
    };
  } catch (error) {
    throw new Error('Failed to get location from IP');
  }
};

// Haversine formula to calculate distance between two points in km
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};
