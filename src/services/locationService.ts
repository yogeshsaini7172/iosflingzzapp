import { getCurrentLocation } from '../utils/locationUtils';
import { updateUserLocation } from './profile';
import { toast } from 'sonner';

// Global flag to track if location permission should be requested
let shouldRequestLocationOnNextUserAction = false;

// Function to mark that location should be requested on next user interaction
export const markLocationPermissionNeeded = () => {
  shouldRequestLocationOnNextUserAction = true;
  console.log('📍 Location permission marked for next user interaction');
};

// Function to check if location permission is needed
export const isLocationPermissionNeeded = () => {
  return shouldRequestLocationOnNextUserAction;
};

// Function to clear the location permission flag
export const clearLocationPermissionFlag = () => {
  shouldRequestLocationOnNextUserAction = false;
};

// Function to request location with user gesture
export const requestLocationWithUserGesture = async (): Promise<boolean> => {
  if (!shouldRequestLocationOnNextUserAction) {
    return false;
  }

  try {
    console.log('📍 Requesting location permission with user gesture...');
    const locationData = await getCurrentLocation();
    
    if (locationData) {
      // Get additional location info
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      const locationUpdate = {
        city: data.address?.city || data.address?.town || data.address?.village || '',
        region: data.address?.state || data.address?.county || '',
        country: data.address?.country || '',
        latitude: locationData.latitude,
        longitude: locationData.longitude
      };

      // Save to profile
      await updateUserLocation(locationUpdate);
      console.log('📍 Location saved successfully after login');
      toast.success('Location detected and saved!');
      
      // Clear the flag since we successfully got location
      clearLocationPermissionFlag();
      return true;
    }
  } catch (error: any) {
    console.log('📍 Location permission failed:', error.message);
    // Don't clear flag if it failed, user can try again
  }
  
  return false;
};

// Function to setup location request on page interactions
export const setupLocationRequestOnInteraction = () => {
  if (!isLocationPermissionNeeded()) {
    return;
  }

  console.log('📍 Setting up location request for next user interaction');

  const requestLocation = async () => {
    const success = await requestLocationWithUserGesture();
    if (success) {
      // Remove event listeners after successful request
      document.removeEventListener('click', requestLocation);
      document.removeEventListener('keydown', requestLocation);
      document.removeEventListener('touchstart', requestLocation);
    }
  };

  // Add event listeners for user interactions
  document.addEventListener('click', requestLocation, { once: true });
  document.addEventListener('keydown', requestLocation, { once: true });
  document.addEventListener('touchstart', requestLocation, { once: true });
};