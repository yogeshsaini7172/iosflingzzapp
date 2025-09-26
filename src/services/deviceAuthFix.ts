/**
 * Device-Specific Google Auth Fix
 * 
 * This addresses the "No credentials available" error that occurs on some devices
 * while working fine on others. The issue is typically device-specific.
 */

import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

interface DeviceAuthResult {
  success: boolean;
  user?: any;
  error?: string;
  deviceInfo?: any;
}

export class DeviceAuthFix {
  
  /**
   * Enhanced Google sign-in with device-specific fallbacks
   */
  static async smartGoogleSignIn(): Promise<DeviceAuthResult> {
    const deviceInfo = this.getDeviceInfo();
    console.log('🔍 Device Auth Debug:', deviceInfo);

    // Strategy 1: Try native auth first (if supported)
    if (deviceInfo.isNative && deviceInfo.hasGoogleServices) {
      console.log('📱 Attempting native Google sign-in...');
      const nativeResult = await this.tryNativeAuth();
      if (nativeResult.success) {
        return nativeResult;
      }
      console.log('❌ Native auth failed:', nativeResult.error);
    }

    // Strategy 2: Fallback to web popup (works on most devices)
    if (!deviceInfo.isNative || deviceInfo.allowWebFallback) {
      console.log('🌐 Falling back to web popup auth...');
      const webResult = await this.tryWebAuth();
      if (webResult.success) {
        return webResult;
      }
      console.log('❌ Web auth failed:', webResult.error);
    }

    // Strategy 3: Check for common device issues and provide guidance
    return this.diagnoseDeviceIssue(deviceInfo);
  }

  /**
   * Get comprehensive device information
   */
  private static getDeviceInfo() {
    const userAgent = navigator.userAgent || '';
    const platform = Capacitor.getPlatform();
    
    return {
      platform,
      isNative: Capacitor.isNativePlatform(),
      userAgent,
      isEmulator: this.detectEmulator(userAgent),
      hasGoogleServices: this.detectGoogleServices(userAgent),
      allowWebFallback: true, // Always allow web fallback
      deviceModel: this.extractDeviceModel(userAgent),
      androidVersion: this.extractAndroidVersion(userAgent),
    };
  }

  /**
   * Detect if running on emulator
   */
  private static detectEmulator(userAgent: string): boolean {
    const emulatorIndicators = [
      'Emulator',
      'Android SDK built for x86',
      'Genymotion',
      'generic',
      'BlueStacks'
    ];
    
    return emulatorIndicators.some(indicator => 
      userAgent.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * Detect Google Play Services availability
   */
  private static detectGoogleServices(userAgent: string): boolean {
    // Heuristic check - not 100% accurate but helps with diagnosis
    const hasGoogleIndicators = [
      'Chrome',
      'GooglePlayServices',
      'GMS'
    ];
    
    const noGoogleIndicators = [
      'HuaweiBrowser',
      'MIUI',
      'LineageOS'
    ];

    const hasGoogle = hasGoogleIndicators.some(indicator => 
      userAgent.includes(indicator)
    );
    
    const noGoogle = noGoogleIndicators.some(indicator => 
      userAgent.includes(indicator)
    );

    return hasGoogle && !noGoogle;
  }

  /**
   * Extract device model from user agent
   */
  private static extractDeviceModel(userAgent: string): string {
    const match = userAgent.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Extract Android version
   */
  private static extractAndroidVersion(userAgent: string): string {
    const match = userAgent.match(/Android\s+([\d.]+)/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Try native Google authentication
   */
  private static async tryNativeAuth(): Promise<DeviceAuthResult> {
    try {
      // Add extra configuration for problematic devices
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      console.log('✅ Native auth successful:', result.user?.email);
      
      // Bridge to Firebase Auth
      if (result.credential?.idToken) {
        const credential = GoogleAuthProvider.credential(
          result.credential.idToken,
          result.credential.accessToken
        );
        const userCredential = await signInWithCredential(auth, credential);
        
        return {
          success: true,
          user: userCredential.user,
          deviceInfo: this.getDeviceInfo()
        };
      }
      
      return {
        success: false,
        error: 'No credential returned from native auth'
      };
      
    } catch (error: any) {
      console.error('❌ Native auth error:', error);
      
      // Analyze specific error types
      if (error.message?.includes('No credentials available')) {
        return {
          success: false,
          error: 'DEVICE_SETUP_REQUIRED',
          deviceInfo: this.getDeviceInfo()
        };
      }
      
      return {
        success: false,
        error: error.message || 'Native auth failed'
      };
    }
  }

  /**
   * Try web-based Google authentication
   */
  private static async tryWebAuth(): Promise<DeviceAuthResult> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Add custom parameters for better mobile compatibility
      provider.setCustomParameters({
        prompt: 'select_account',
        display: 'popup'
      });
      
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Web auth successful:', result.user.email);
      
      return {
        success: true,
        user: result.user,
        deviceInfo: this.getDeviceInfo()
      };
      
    } catch (error: any) {
      console.error('❌ Web auth error:', error);
      return {
        success: false,
        error: error.message || 'Web auth failed'
      };
    }
  }

  /**
   * Diagnose device-specific issues and provide solutions
   */
  private static diagnoseDeviceIssue(deviceInfo: any): DeviceAuthResult {
    const issues = [];
    const solutions = [];

    // Check for emulator issues
    if (deviceInfo.isEmulator) {
      issues.push('Running on emulator');
      solutions.push('Use emulator with Google Play Store');
      solutions.push('Test on physical device');
    }

    // Check for Google Services issues
    if (!deviceInfo.hasGoogleServices) {
      issues.push('Google Play Services not detected');
      solutions.push('Install/update Google Play Services');
      solutions.push('Add Google account to device');
    }

    // Check for specific device types
    if (deviceInfo.userAgent.includes('Huawei')) {
      issues.push('Huawei device detected');
      solutions.push('Huawei devices may not support Google services');
      solutions.push('Use phone authentication instead');
    }

    const errorMessage = issues.length > 0 
      ? `Device issues detected: ${issues.join(', ')}. Solutions: ${solutions.join(', ')}`
      : 'Authentication failed for unknown device-specific reason';

    return {
      success: false,
      error: errorMessage,
      deviceInfo
    };
  }

  /**
   * Get user-friendly error message with solutions
   */
  static getErrorGuidance(error: string, deviceInfo?: any): string {
    if (error === 'DEVICE_SETUP_REQUIRED') {
      return `
🔧 Device Setup Required:

Your device needs proper Google account configuration:

1. ✅ Add Google Account:
   - Settings → Accounts → Add Account → Google
   - Sign in with your Google account

2. ✅ Update Google Play Services:
   - Play Store → My apps & games → Update Google Play services

3. ✅ Check Device Compatibility:
   - Ensure device has Google Play Services (not available on some custom ROMs)

4. ✅ Alternative: Use Phone Authentication
   - Our app also supports phone number sign-in
   - This works on all devices regardless of Google Services

5. ✅ Test on Different Device:
   - If available, test on a device with standard Google services
      `;
    }

    if (error.includes('No credentials available')) {
      return `
❌ Google Authentication Not Available on This Device

This usually means:
• No Google account is configured on this device
• Google Play Services is not installed or outdated  
• Device doesn't support Google authentication (some custom ROMs)

✅ Quick Fixes:
1. Add a Google account in Settings → Accounts
2. Update Google Play Services from Play Store
3. Use phone authentication instead (always works)
4. Test on a different device if available
      `;
    }

    return error;
  }
}

// Export individual functions for direct use
export const smartGoogleSignIn = DeviceAuthFix.smartGoogleSignIn.bind(DeviceAuthFix);
export const getAuthErrorGuidance = DeviceAuthFix.getErrorGuidance.bind(DeviceAuthFix);