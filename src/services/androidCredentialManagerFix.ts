/**
 * Android Credential Manager Detection and Fallback
 * Handles devices that don't support the Android Credential Manager API
 */

import { Capacitor } from '@capacitor/core';

export interface CredentialManagerSupport {
  isSupported: boolean;
  reason?: string;
  androidVersion?: number;
  hasGooglePlayServices?: boolean;
}

/**
 * Detects if the device supports Android Credential Manager
 * Credential Manager is available on Android 9+ with Google Play Services
 */
export async function detectCredentialManagerSupport(): Promise<CredentialManagerSupport> {
  console.log('🔍 Checking Credential Manager support...');
  
  // Not applicable for non-native platforms
  if (!Capacitor.isNativePlatform()) {
    return {
      isSupported: false,
      reason: 'Not a native platform'
    };
  }
  
  // Only applicable for Android
  if (Capacitor.getPlatform() !== 'android') {
    return {
      isSupported: true, // iOS doesn't use credential manager
      reason: 'Not Android platform'
    };
  }
  
  try {
    // Check Android version from user agent
    const userAgent = navigator.userAgent;
    const androidMatch = userAgent.match(/Android (\d+)/);
    const androidVersion = androidMatch ? parseInt(androidMatch[1]) : 0;
    
    console.log('📱 Android version detected:', androidVersion);
    
    // Credential Manager requires Android 9+ (API 28+)
    if (androidVersion > 0 && androidVersion < 9) {
      return {
        isSupported: false,
        reason: 'Android version too old (requires Android 9+)',
        androidVersion
      };
    }
    
    // Check for Google Play Services indicators
    const hasGooglePlayServices = userAgent.includes('GMS') || 
                                   userAgent.includes('Google') ||
                                   userAgent.includes('Play Services');
    
    console.log('🔍 Google Play Services indicators:', hasGooglePlayServices);
    
    return {
      isSupported: true,
      androidVersion,
      hasGooglePlayServices
    };
    
  } catch (error) {
    console.error('❌ Error detecting credential manager support:', error);
    return {
      isSupported: false,
      reason: 'Detection failed'
    };
  }
}

/**
 * Checks if an error is related to credential manager not being supported
 */
export function isCredentialManagerError(error: any): boolean {
  if (!error) return false;
  
  const errorString = error.message || error.toString() || '';
  const errorCode = error.code || '';
  
  const credentialManagerErrors = [
    'credential manager',
    'credentialmanager',
    'doesn\'t support credential',
    'does not support credential',
    'credential api not available',
    'credential api not supported',
    'no credential provider',
    'credential provider not found'
  ];
  
  return credentialManagerErrors.some(errorText => 
    errorString.toLowerCase().includes(errorText.toLowerCase())
  ) || errorCode === 'auth/credential-manager-not-available';
}

/**
 * Gets a user-friendly error message for credential manager issues
 */
export function getCredentialManagerErrorMessage(): string {
  return 'Your device doesn\'t support the latest authentication method. Using alternative sign-in method...';
}
