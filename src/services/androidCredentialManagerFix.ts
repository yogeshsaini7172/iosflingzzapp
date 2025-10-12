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
 * Credential Manager requires Android 9+ (API 28+) with Google Play Services
 * This uses multiple detection methods for maximum reliability
 */
export async function detectCredentialManagerSupport(): Promise<CredentialManagerSupport> {
  console.log('🔍 === CREDENTIAL MANAGER DETECTION START ===');
  
  // Check 1: Platform validation
  if (!Capacitor.isNativePlatform()) {
    console.log('❌ Not a native platform');
    return {
      isSupported: false,
      reason: 'Not a native platform (web/browser)'
    };
  }
  
  const platform = Capacitor.getPlatform();
  console.log('📱 Platform:', platform);
  
  // Check 2: iOS doesn't use Credential Manager (uses different auth method)
  if (platform !== 'android') {
    console.log('✅ iOS platform - uses native auth (not Credential Manager)');
    return {
      isSupported: true,
      reason: 'iOS uses native authentication'
    };
  }
  
  try {
    // Check 3: Parse Android version from user agent
    const userAgent = navigator.userAgent;
    console.log('📱 User Agent:', userAgent);
    
    const androidMatch = userAgent.match(/Android (\d+)\.?(\d+)?/);
    const androidVersion = androidMatch ? parseInt(androidMatch[1]) : 0;
    const androidSubVersion = androidMatch?.[2] ? parseInt(androidMatch[2]) : 0;
    
    console.log(`📱 Android Version: ${androidVersion}.${androidSubVersion}`);
    
    // Check 4: Minimum version requirement (Android 9 = API 28)
    if (androidVersion > 0 && androidVersion < 9) {
      console.log(`❌ Android ${androidVersion} is too old (requires Android 9+)`);
      return {
        isSupported: false,
        reason: `Android ${androidVersion} detected - Credential Manager requires Android 9+`,
        androidVersion
      };
    }
    
    // Check 5: Google Play Services presence
    const hasGMS = userAgent.includes('GMS');
    const hasGoogleIndicators = userAgent.includes('Google');
    const hasPlayServices = userAgent.includes('Play Services');
    const hasGooglePlayServices = hasGMS || hasGoogleIndicators || hasPlayServices;
    
    console.log('🔍 Google Play Services Detection:');
    console.log('  - GMS in UA:', hasGMS);
    console.log('  - Google in UA:', hasGoogleIndicators);
    console.log('  - Play Services in UA:', hasPlayServices);
    console.log('  - Overall Assessment:', hasGooglePlayServices ? '✅ Available' : '⚠️ Not detected');
    
    // Check 6: Device compatibility
    // Some custom ROMs or devices without Google Play Services won't support Credential Manager
    if (androidVersion >= 9 && !hasGooglePlayServices) {
      console.log('⚠️ Android 9+ detected but Google Play Services not found in UA');
      console.log('💡 Will attempt native auth but be ready to fallback');
    }
    
    console.log('✅ Credential Manager: Supported');
    return {
      isSupported: true,
      androidVersion,
      hasGooglePlayServices
    };
    
  } catch (error) {
    console.error('❌ Detection error:', error);
    return {
      isSupported: false,
      reason: `Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  } finally {
    console.log('🔍 === CREDENTIAL MANAGER DETECTION END ===');
  }
}

/**
 * Checks if an error is related to credential manager not being supported
 * Includes comprehensive error patterns from various Android configurations
 */
export function isCredentialManagerError(error: any): boolean {
  if (!error) return false;
  
  const errorString = (error.message || error.toString() || '').toLowerCase();
  const errorCode = (error.code || '').toLowerCase();
  
  // Comprehensive list of credential manager error patterns
  const credentialManagerErrors = [
    'credential manager',
    'credentialmanager',
    'doesn\'t support credential',
    'does not support credential',
    'credential api not available',
    'credential api not supported',
    'no credential provider',
    'credential provider not found',
    'credentials api',
    'play services',
    'google play',
    'api not available',
    'provider not installed',
    'unsupported device'
  ];
  
  const hasErrorMatch = credentialManagerErrors.some(errorText => 
    errorString.includes(errorText)
  );
  
  const hasCodeMatch = errorCode === 'auth/credential-manager-not-available' ||
                       errorCode === 'auth/api-not-available' ||
                       errorCode === '16'; // Google Play Services error code
  
  if (hasErrorMatch || hasCodeMatch) {
    console.log('🔍 Detected Credential Manager error:', {
      errorString: errorString.substring(0, 100),
      errorCode,
      matched: hasErrorMatch ? 'error message' : 'error code'
    });
  }
  
  return hasErrorMatch || hasCodeMatch;
}

/**
 * Gets a user-friendly error message for credential manager issues
 */
export function getCredentialManagerErrorMessage(androidVersion?: number): string {
  if (androidVersion && androidVersion < 9) {
    return `Your device (Android ${androidVersion}) doesn't support the latest authentication. Using alternative sign-in method...`;
  }
  return 'Using alternative sign-in method for your device. This may take a moment...';
}
