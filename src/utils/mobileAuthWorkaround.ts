// Mobile Authentication Workaround for WebView sessionStorage issues
// This implements a custom auth flow that works around Firebase's WebView limitations

export interface MobileAuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

// Custom Google OAuth flow for mobile WebView environments
export const mobileGoogleAuth = async (): Promise<MobileAuthResult> => {
  try {
    console.log('🔧 Initiating mobile Google auth workaround...');
    
    // Check if we're in a mobile WebView environment
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isWebView = navigator.userAgent.includes('wv') || navigator.userAgent.includes('Mobile');
    
    if (!isMobile && !isWebView) {
      console.log('📱 Not in mobile environment, using standard auth');
      return { success: false, error: 'Not in mobile environment' };
    }
    
    console.log('📱 Mobile WebView detected, implementing workaround...');
    
    // Create a custom authentication URL that bypasses Firebase's sessionStorage requirements
    const authUrl = buildCustomGoogleAuthUrl();
    
    // Open authentication in a new window/tab that can handle the OAuth flow
    const authWindow = window.open(authUrl, '_blank', 'width=500,height=600,scrollbars=yes');
    
    if (!authWindow) {
      return { success: false, error: 'Popup blocked. Please allow popups and try again.' };
    }
    
    // Listen for the authentication result
    return new Promise((resolve) => {
      const checkAuthResult = setInterval(() => {
        try {
          if (authWindow.closed) {
            clearInterval(checkAuthResult);
            resolve({ success: false, error: 'Authentication cancelled' });
            return;
          }
          
          // Check if the auth window has navigated to our success page
          const authResult = localStorage.getItem('mobile_auth_result');
          if (authResult) {
            clearInterval(checkAuthResult);
            authWindow.close();
            localStorage.removeItem('mobile_auth_result');
            
            const result = JSON.parse(authResult);
            resolve({ success: true, user: result });
          }
        } catch (error) {
          // Window not accessible yet, continue checking
        }
      }, 1000);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkAuthResult);
        if (!authWindow.closed) {
          authWindow.close();
        }
        resolve({ success: false, error: 'Authentication timeout' });
      }, 300000);
    });
    
  } catch (error) {
    console.error('🔥 Mobile auth workaround error:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

// Build a custom Google OAuth URL that works with mobile WebViews
const buildCustomGoogleAuthUrl = (): string => {
  const clientId = '533305529581-your-client-id.apps.googleusercontent.com'; // Update with your actual client ID
  const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
  const scope = encodeURIComponent('email profile');
  const responseType = 'code';
  const state = generateRandomState();
  
  // Store state for verification
  localStorage.setItem('oauth_state', state);
  
  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${scope}&` +
    `response_type=${responseType}&` +
    `state=${state}&` +
    `prompt=select_account`;
};

// Generate a random state for OAuth security
const generateRandomState = (): string => {
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);
  return Array.from(array, dec => dec.toString(16)).join('');
};

// Phone authentication workaround for mobile
export const mobilePhoneAuth = async (phoneNumber: string): Promise<MobileAuthResult> => {
  try {
    console.log('📱 Mobile phone auth - bypassing reCAPTCHA issues...');
    
    // Clear any existing reCAPTCHA
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (recaptchaContainer) {
      recaptchaContainer.innerHTML = '';
      recaptchaContainer.style.display = 'none';
    }
    
    // Create a hidden reCAPTCHA container for mobile
    const hiddenContainer = document.createElement('div');
    hiddenContainer.id = 'mobile-recaptcha-container';
    hiddenContainer.style.position = 'fixed';
    hiddenContainer.style.top = '-1000px';
    hiddenContainer.style.left = '-1000px';
    hiddenContainer.style.visibility = 'hidden';
    document.body.appendChild(hiddenContainer);
    
    // Import Firebase auth functions dynamically to avoid early initialization issues
    const { signInWithPhoneNumber, RecaptchaVerifier } = await import('firebase/auth');
    const { auth } = await import('../firebase');
    
    // Create reCAPTCHA verifier with mobile-optimized settings
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'mobile-recaptcha-container', {
      size: 'invisible',
      callback: () => console.log('reCAPTCHA solved successfully'),
      'expired-callback': () => console.log('reCAPTCHA expired'),
      'error-callback': (error: any) => console.error('reCAPTCHA error:', error)
    });
    
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    
    // Clean up
    document.body.removeChild(hiddenContainer);
    
    return { success: true, user: confirmationResult };
    
  } catch (error: any) {
    console.error('📱 Mobile phone auth error:', error);
    return { success: false, error: error.message };
  }
};