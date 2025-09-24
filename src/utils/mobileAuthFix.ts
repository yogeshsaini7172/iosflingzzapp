// Mobile Authentication Fix for Capacitor/WebView environments
import { toast } from 'sonner';

export const detectMobileEnvironment = () => {
  if (typeof window === 'undefined') return null;
  
  const userAgent = window.navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isWebView = userAgent.includes('wv') || userAgent.includes('Mobile') || userAgent.includes('WebView');
  const isCapacitor = userAgent.includes('Capacitor');
  const isFirebaseApp = userAgent.includes('FirebaseApp');
  
  // Check if sessionStorage is actually accessible
  let sessionStorageAccessible = false;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      sessionStorageAccessible = true;
    }
  } catch (e) {
    console.warn('📱 sessionStorage not accessible:', e);
    sessionStorageAccessible = false;
  }
  
  return { 
    isMobile, 
    isWebView, 
    isCapacitor, 
    isFirebaseApp,
    sessionStorageAccessible,
    userAgent 
  };
};

export const preventRedirectAuth = () => {
  const environment = detectMobileEnvironment();
  
  // In mobile environments or when sessionStorage is inaccessible, avoid redirect auth
  if (environment && (environment.isMobile || environment.isWebView || environment.isCapacitor || environment.isFirebaseApp || !environment.sessionStorageAccessible)) {
    console.log('📱 Mobile/WebView environment or sessionStorage inaccessible - disabling redirect auth');
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
  
  // Check for the specific "missing initial state" error and sessionStorage issues
  if (error.message?.includes('missing initial state') || 
      error.message?.includes('sessionStorage is inaccessible') ||
      error.message?.includes('Unable to process request due to missing initial state') ||
      error.message?.includes('browser sessionStorage is inaccessible') ||
      error.message?.includes('storage-partitioned browser environment') ||
      error.code === 'auth/web-storage-unsupported') {
    
    console.log('🚫 Detected mobile sessionStorage auth error');
    toast.error('Google sign-in is not supported in this mobile browser. Please use phone number authentication instead.', {
      duration: 8000,
    });
    return true;
  }
  
  // Check for popup/redirect related errors
  if (error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/redirect-cancelled-by-user' ||
      error.message?.includes('popup') ||
      error.message?.includes('redirect')) {
    
    console.log('🚫 Popup/redirect auth blocked in mobile');
    toast.error('Google sign-in is not available in this environment. Please use phone authentication.', {
      duration: 6000,
    });
    return true;
  }
  
  return false; // Unknown error, handle normally
};