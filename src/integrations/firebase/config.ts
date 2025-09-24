import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Mobile-optimized Firebase configuration
if (typeof window !== 'undefined') {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
  const isCapacitor = window.navigator.userAgent.includes('Capacitor');
  
  console.log('📱 Mobile detection:', { isMobile, isCapacitor, userAgent: window.navigator.userAgent });
}

const firebaseConfig = {
  apiKey: "AIzaSyCDU4DuUoOfbtviGMud-Q2Xllu7k4ruRm4",
  authDomain: "datingapp-275cb.firebaseapp.com",
  projectId: "datingapp-275cb",
  storageBucket: "datingapp-275cb.firebasestorage.app",
  messagingSenderId: "533305529581",
  appId: "1:533305529581:web:81cbba3b6aefa6ac19a8e4",
  measurementId: "G-WCH701HLXM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Firebase Auth for mobile environments - no sessionStorage overrides needed

// Configure Firebase Auth for mobile compatibility
if (typeof window !== 'undefined') {
  // Force localStorage for mobile environments to avoid sessionStorage issues
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
  const isWebView = window.navigator.userAgent.includes('wv');
  
  console.log('🔧 Firebase Auth Config:', { isMobile, isWebView });
  
  if (isMobile || isWebView) {
    console.log('📱 Mobile/WebView detected - forcing localStorage persistence');
    // Force localStorage for mobile to avoid "missing initial state" error
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('❌ Failed to set Firebase auth persistence:', error);
    });
  } else {
    // Desktop browser can use default persistence
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn('Failed to set Firebase auth persistence:', error);
    });
  }
}

// Initialize Analytics (guarded for environments where it's unsupported)
export const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);
// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper function to create RecaptchaVerifier optimized for Indian users
export const createRecaptchaVerifier = (elementId: string) => {
  return new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved successfully');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    },
    'error-callback': (error: any) => {
      console.error('reCAPTCHA error:', error);
    }
  });
};

export default app;