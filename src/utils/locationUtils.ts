export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: string;
}

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'Geolocation API',
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        // Fallback to IP-based lookup if geolocation fails
        fetchLocationFromIP()
          .then(resolve)
          .catch(() => reject(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000, // 5 minutes
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
