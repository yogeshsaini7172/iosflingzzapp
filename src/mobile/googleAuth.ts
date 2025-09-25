import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

export const initializeGoogleAuth = () => {
  if (Capacitor.isNativePlatform()) {
    GoogleAuth.initialize({
      clientId: '533305529581-YOUR_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual client ID
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  }
};

export const isGoogleAuthAvailable = () => {
  return Capacitor.isNativePlatform();
};