// Simple Phone-First Authentication for Mobile
import { toast } from 'sonner';

export const isMobileEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isWebView = userAgent.includes('wv') || userAgent.includes('Mobile');
  const isCapacitor = userAgent.includes('Capacitor');
  
  console.log('📱 Environment check:', { isMobile, isWebView, isCapacitor, userAgent });
  
  return isMobile || isWebView || isCapacitor;
};

export const showMobileAuthOptions = () => {
  console.log('📱 Mobile environment detected - showing phone auth recommendation');
  
  toast.info('For the best mobile experience, please use phone number authentication', {
    duration: 5000,
    action: {
      label: 'Got it',
      onClick: () => console.log('User acknowledged mobile auth recommendation'),
    },
  });
};

export const handleMobileAuthError = (error: any) => {
  console.error('📱 Mobile auth error:', error);
  
  if (error.message?.includes('sessionStorage') || 
      error.message?.includes('initial state') ||
      error.code === 'auth/web-storage-unsupported') {
    
    toast.error('Google sign-in encountered a storage issue. Please try phone authentication for a more reliable experience.', {
      duration: 7000,
    });
    
    return true; // Indicates this is a known mobile auth issue
  }
  
  if (error.message?.includes('not supported in this mobile browser') ||
      error.message?.includes('not supported in mobile apps')) {
    
    toast.error('Google sign-in is not available in this environment. Please use phone authentication.', {
      duration: 7000,
    });
    
    return true;
  }
  
  return false; // Unknown error, handle normally
};