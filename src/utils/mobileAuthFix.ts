// Mobile Authentication Fix for Capacitor/WebView environments
import { toast } from 'sonner';

export const detectMobileEnvironment = () => {
  if (typeof window === 'undefined') return null;
  
  const userAgent = window.navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isWebView = userAgent.includes('wv') || userAgent.includes('Mobile');
  const isCapacitor = userAgent.includes('Capacitor');
  
  return { isMobile, isWebView, isCapacitor, userAgent };
};

export const preventRedirectAuth = () => {
  const environment = detectMobileEnvironment();
  
  // In mobile environments, completely avoid signInWithRedirect
  if (environment && (environment.isMobile || environment.isWebView || environment.isCapacitor)) {
    console.log('📱 Mobile environment - disabling redirect auth to prevent sessionStorage issues');
    return true;
  }
  
  return false;
};

export const showMobileAuthRecommendation = () => {
  if (preventRedirectAuth()) {
    toast.info('💡 For the best mobile experience, we recommend using phone number authentication', {
      duration: 6000,
    });
  }
};

export const handleMobileAuthError = (error: any): boolean => {
  console.error('🔥 Firebase Auth Error:', error);
  
  // Check for the specific "missing initial state" error
  if (error.message?.includes('missing initial state') || 
      error.message?.includes('sessionStorage is inaccessible') ||
      error.code === 'auth/web-storage-unsupported') {
    
    console.log('🚫 Detected mobile sessionStorage auth error');
    toast.error('Authentication unavailable in this mobile environment. Please use phone number sign-in instead.', {
      duration: 8000,
    });
    return true;
  }
  
  // Check for popup/redirect related errors
  if (error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.message?.includes('popup')) {
    
    console.log('🚫 Popup auth blocked in mobile');
    toast.error('Google sign-in is not available. Please use phone authentication.', {
      duration: 6000,
    });
    return true;
  }
  
  return false; // Unknown error, handle normally
};