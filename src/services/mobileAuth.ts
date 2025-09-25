// Enhanced mobile authentication service
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export interface MobileAuthEnvironment {
  platform: string;
  isNative: boolean;
  isCapacitor: boolean;
  userAgent: string;
  supports: {
    GoogleAuth: boolean;
    storage: boolean;
    notifications: boolean;
  };
}

// Comprehensive mobile environment detection
export function detectMobileEnvironment(): MobileAuthEnvironment {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  const isCapacitor = typeof Capacitor !== 'undefined';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  // Check for various capabilities
  const supports = {
    GoogleAuth: isNative && (platform === 'android' || platform === 'ios'),
    storage: typeof localStorage !== 'undefined',
    notifications: 'Notification' in (globalThis as any)
  };

  return {
    platform,
    isNative,
    isCapacitor,
    userAgent,
    supports
  };
}

// Mobile-specific error handler
export function handleMobileAuthError(error: any, context: string): string {
  console.error(`❌ Mobile Auth Error [${context}]:`, error);

  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Handle specific mobile auth errors
  if (errorMessage.includes('cancelled') || errorMessage.includes('canceled')) {
    return 'Authentication was cancelled. Please try again.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (errorMessage.includes('Google services')) {
    return 'Google services are not available. Please try phone authentication.';
  }
  
  if (errorMessage.includes('initialize')) {
    return 'Authentication service initialization failed. Please restart the app.';
  }
  
  if (errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
    return 'Invalid authentication data. Please contact support.';
  }
  
  // Default fallback
  return 'Authentication failed. Please try again or use an alternative method.';
}

// Show appropriate authentication recommendations for mobile users
export function showMobileAuthRecommendation() {
  const env = detectMobileEnvironment();
  
  if (env.isNative) {
    if (!env.supports.GoogleAuth) {
      toast.info('💡 For the best mobile experience, we recommend using phone number authentication', {
        duration: 6000,
      });
    }
  } else {
    // Web environment - recommend web-optimized flow
    console.log('🌐 Web environment detected - using standard auth flow');
  }
}

// Mobile-specific auth state cleanup
export async function cleanupMobileAuthState() {
  try {
    // Clear any cached auth data specific to mobile
    if (typeof localStorage !== 'undefined') {
      const keysToRemove = [
        'google_auth_temp',
        'mobile_auth_state',
        'capacitor_auth_cache'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    }
    
    console.log('✅ Mobile auth state cleaned up');
  } catch (error) {
    console.warn('⚠️ Failed to cleanup mobile auth state:', error);
  }
}

// Enhanced mobile connectivity check
export function checkMobileConnectivity(): boolean {
  if (typeof navigator === 'undefined') return true;
  
  return navigator.onLine !== false;
}