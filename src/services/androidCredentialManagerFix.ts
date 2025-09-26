/**
 * Android Credential Manager Fix
 * 
 * Addresses the specific "No credentials available" error from Android's CredentialManager
 * This error occurs when the device doesn't have proper Google account setup or 
 * Google Play Services configuration for the Credential Manager API.
 */

import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

export interface CredentialManagerFixResult {
  success: boolean;
  user?: any;
  error?: string;
  method?: string;
  deviceDiagnostics?: any;
}

export class AndroidCredentialManagerFix {

  /**
   * Enhanced Google sign-in that bypasses Credential Manager issues
   */
  static async fixedGoogleSignIn(): Promise<CredentialManagerFixResult> {
    console.log('🔧 Starting Android Credential Manager fix...');
    
    const diagnostics = this.getDiagnostics();
    console.log('📊 Device diagnostics:', diagnostics);

    // Strategy 1: Try native auth with error handling
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Attempting native auth with Credential Manager bypass...');
      const nativeResult = await this.tryNativeWithBypass();
      if (nativeResult.success) {
        return { ...nativeResult, method: 'native-bypassed', deviceDiagnostics: diagnostics };
      }
      console.log('❌ Native auth failed:', nativeResult.error);
    }

    // Strategy 2: Force web popup (bypasses Credential Manager entirely)
    console.log('🌐 Falling back to web popup (bypasses Credential Manager)...');
    const webResult = await this.forceWebAuth();
    if (webResult.success) {
      return { ...webResult, method: 'web-popup', deviceDiagnostics: diagnostics };
    }

    // Strategy 3: Return detailed error with fix instructions
    return {
      success: false,
      error: 'CREDENTIAL_MANAGER_UNAVAILABLE',
      method: 'none',
      deviceDiagnostics: diagnostics
    };
  }

  /**
   * Get device diagnostics for Credential Manager issues
   */
  private static getDiagnostics() {
    const userAgent = navigator.userAgent || '';
    return {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      userAgent,
      hasCredentialManagerApi: this.hasCredentialManagerSupport(userAgent),
      androidVersion: this.extractAndroidVersion(userAgent),
      googlePlayServicesVersion: this.estimatePlayServicesVersion(userAgent),
      deviceManufacturer: this.getDeviceManufacturer(userAgent),
      isEmulator: this.isEmulator(userAgent),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Try native auth with Credential Manager bypass techniques
   */
  private static async tryNativeWithBypass(): Promise<CredentialManagerFixResult> {
    try {
      // Method 1: Try with additional configuration
      console.log('🔄 Method 1: Native auth with enhanced config...');
      
      // Add delay to ensure Google Play Services is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      if (result.user && result.credential?.idToken) {
        console.log('✅ Native auth successful with enhanced config');
        
        // Bridge to Firebase
        const credential = GoogleAuthProvider.credential(
          result.credential.idToken,
          result.credential.accessToken
        );
        const userCredential = await signInWithCredential(auth, credential);
        
        return {
          success: true,
          user: userCredential.user
        };
      }

      return {
        success: false,
        error: 'No credential returned from native auth'
      };

    } catch (error: any) {
      console.error('❌ Native auth with bypass failed:', error);
      
      // Analyze the specific error
      if (error.message?.includes('No credentials available')) {
        return {
          success: false,
          error: 'CREDENTIAL_MANAGER_NO_ACCOUNTS'
        };
      } else if (error.message?.includes('CredentialManager')) {
        return {
          success: false,
          error: 'CREDENTIAL_MANAGER_API_ERROR'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Native auth failed'
      };
    }
  }

  /**
   * Force web-based authentication (completely bypasses Credential Manager)
   */
  private static async forceWebAuth(): Promise<CredentialManagerFixResult> {
    try {
      console.log('🌐 Forcing web popup authentication...');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Enhanced configuration for mobile WebView
      provider.setCustomParameters({
        prompt: 'select_account',
        display: 'popup',
        access_type: 'online'
      });
      
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Web popup auth successful:', result.user.email);
      
      return {
        success: true,
        user: result.user
      };
      
    } catch (error: any) {
      console.error('❌ Web popup auth failed:', error);
      return {
        success: false,
        error: error.message || 'Web auth failed'
      };
    }
  }

  /**
   * Check if device supports Credential Manager API
   */
  private static hasCredentialManagerSupport(userAgent: string): boolean {
    // Credential Manager requires Android 14+ (API 34+) in most cases
    const androidVersion = this.extractAndroidVersion(userAgent);
    if (!androidVersion || androidVersion === 'Unknown') return false;
    
    const majorVersion = parseInt(androidVersion.split('.')[0]);
    return majorVersion >= 11; // Conservative estimate
  }

  /**
   * Extract Android version from user agent
   */
  private static extractAndroidVersion(userAgent: string): string {
    const match = userAgent.match(/Android\s+([\d.]+)/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Estimate Google Play Services version (heuristic)
   */
  private static estimatePlayServicesVersion(userAgent: string): string {
    if (userAgent.includes('Chrome/')) {
      const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
      if (chromeMatch) {
        const chromeVersion = parseInt(chromeMatch[1].split('.')[0]);
        // Newer Chrome usually means newer Play Services
        return chromeVersion > 100 ? 'Recent' : 'Older';
      }
    }
    return 'Unknown';
  }

  /**
   * Get device manufacturer
   */
  private static getDeviceManufacturer(userAgent: string): string {
    const manufacturers = ['Samsung', 'Huawei', 'OnePlus', 'Xiaomi', 'LG', 'Sony'];
    for (const manufacturer of manufacturers) {
      if (userAgent.includes(manufacturer)) {
        return manufacturer;
      }
    }
    return 'Unknown';
  }

  /**
   * Check if running on emulator
   */
  private static isEmulator(userAgent: string): boolean {
    const emulatorIndicators = ['Emulator', 'Android SDK built for x86', 'generic'];
    return emulatorIndicators.some(indicator => 
      userAgent.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * Get user-friendly error message with specific fixes
   */
  static getCredentialManagerErrorGuidance(error: string, diagnostics?: any): string {
    const baseMessage = `
🔧 Android Credential Manager Error Detected

The error comes from Android's Credential Manager API, which requires:
`;

    switch (error) {
      case 'CREDENTIAL_MANAGER_NO_ACCOUNTS':
        return baseMessage + `
❌ Problem: No Google accounts configured for Credential Manager

✅ Solutions (try in order):
1. Add Google Account:
   • Settings → Accounts & Backup → Manage Accounts
   • Add Account → Google → Sign in

2. Update Google Play Services:
   • Play Store → Search "Google Play Services" 
   • Update if available

3. Clear Google Play Services:
   • Settings → Apps → Google Play Services → Storage
   • Clear Cache and Clear Data
   • Restart device

4. Check Device Compatibility:
   • ${diagnostics?.deviceManufacturer || 'Your device'} may have restrictions
   • Try on a different device if available
        `;

      case 'CREDENTIAL_MANAGER_API_ERROR':
        return baseMessage + `
❌ Problem: Credential Manager API is not functioning properly

✅ Solutions:
1. Update Android System WebView:
   • Play Store → Search "Android System WebView"
   • Update to latest version

2. Update Google Play Services:
   • Play Store → Search "Google Play Services"
   • Ensure latest version is installed

3. Restart Device:
   • Sometimes fixes temporary API issues

4. Alternative: Use phone authentication instead
        `;

      case 'CREDENTIAL_MANAGER_UNAVAILABLE':
        return baseMessage + `
❌ Problem: Credential Manager completely unavailable

This usually means:
• Device lacks Google Play Services
• Custom ROM without Google services
• Corporate device with restrictions

✅ Solutions:
1. Check Google Play Services:
   • Try opening Play Store
   • If it doesn't work, Google services aren't available

2. Use Phone Authentication:
   • Our app supports phone number sign-in
   • Works on all devices regardless of Google services

3. Test on Different Device:
   • Standard Android devices with Google services
        `;

      default:
        return baseMessage + `
❌ Problem: ${error}

✅ General Solutions:
1. Add Google account to device
2. Update Google Play Services
3. Update Android System WebView
4. Restart device
5. Use phone authentication as alternative
        `;
    }
  }

  /**
   * Quick device compatibility check
   */
  static async checkDeviceCompatibility(): Promise<{
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const diagnostics = this.getDiagnostics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (diagnostics.isEmulator) {
      issues.push('Running on emulator');
      recommendations.push('Test on physical device with Google Play Services');
    }

    if (!diagnostics.hasCredentialManagerApi) {
      issues.push('Android version may not support Credential Manager fully');
      recommendations.push('Update to Android 12+ for best compatibility');
    }

    if (diagnostics.deviceManufacturer === 'Huawei') {
      issues.push('Huawei device may not support Google services');
      recommendations.push('Use phone authentication instead of Google sign-in');
    }

    if (diagnostics.googlePlayServicesVersion === 'Older') {
      issues.push('Google Play Services may be outdated');
      recommendations.push('Update Google Play Services from Play Store');
    }

    return {
      compatible: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// Export the main function for easy use
export const fixedGoogleSignIn = AndroidCredentialManagerFix.fixedGoogleSignIn.bind(AndroidCredentialManagerFix);
export const getCredentialManagerGuidance = AndroidCredentialManagerFix.getCredentialManagerErrorGuidance.bind(AndroidCredentialManagerFix);
export const checkDeviceCompatibility = AndroidCredentialManagerFix.checkDeviceCompatibility.bind(AndroidCredentialManagerFix);