import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Mobile WebView sessionStorage polyfill - MUST be before Firebase init
if (typeof window !== 'undefined') {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
  const isWebView = window.navigator.userAgent.includes('wv') || window.navigator.userAgent.includes('Mobile');
  const isCapacitor = window.navigator.userAgent.includes('Capacitor');
  
  console.log('🔍 Environment detection:', { isMobile, isWebView, isCapacitor, userAgent: window.navigator.userAgent });
  
  if (isMobile || isWebView || isCapacitor) {
    console.log('🔧 Applying AGGRESSIVE mobile storage fix');
    
    // Create a localStorage-backed sessionStorage replacement
    const mobileSessionStorage = {
      _prefix: 'mobileSession_',
      getItem: function(key: string): string | null {
        console.log('📱 Mobile sessionStorage.getItem:', key);
        const prefixedKey = this._prefix + key;
        const value = localStorage.getItem(prefixedKey);
        console.log('📱 Retrieved from localStorage:', value ? 'found' : 'not found');
        return value;
      },
      setItem: function(key: string, value: string): void {
        console.log('📱 Mobile sessionStorage.setItem:', key);
        const prefixedKey = this._prefix + key;
        localStorage.setItem(prefixedKey, value);
        console.log('📱 Stored to localStorage with prefix');
      },
      removeItem: function(key: string): void {
        console.log('📱 Mobile sessionStorage.removeItem:', key);
        const prefixedKey = this._prefix + key;
        localStorage.removeItem(prefixedKey);
      },
      clear: function(): void {
        console.log('📱 Mobile sessionStorage.clear()');
        // Only clear our prefixed items
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this._prefix)) {
            localStorage.removeItem(key);
          }
        });
      },
      key: function(index: number): string | null {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this._prefix));
        return keys[index]?.replace(this._prefix, '') as string || null;
      },
      get length(): number {
        return Object.keys(localStorage).filter(k => k.startsWith(this._prefix)).length;
      }
    };
    
    // Completely replace sessionStorage
    try {
      // Delete existing sessionStorage
      delete (window as any).sessionStorage;
      
      // Define new sessionStorage
      Object.defineProperty(window, 'sessionStorage', {
        value: mobileSessionStorage,
        writable: false,
        configurable: false,
        enumerable: true
      });
      
      console.log('✅ Mobile sessionStorage completely replaced with localStorage-backed version');
    } catch (error) {
      console.warn('⚠️ Could not replace sessionStorage completely:', error);
      
      // Fallback: monkey patch existing sessionStorage methods
      const originalSessionStorage = window.sessionStorage;
      
      ['getItem', 'setItem', 'removeItem', 'clear'].forEach(method => {
        const originalMethod = originalSessionStorage[method as keyof Storage];
        (originalSessionStorage as any)[method] = function(...args: any[]) {
          try {
            return (mobileSessionStorage as any)[method].apply(mobileSessionStorage, args);
          } catch (e) {
            console.warn(`SessionStorage ${method} fallback:`, e);
            return originalMethod.apply(originalSessionStorage, args);
          }
        };
      });
      
      console.log('✅ Mobile sessionStorage methods monkey-patched');
    }
  }
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

// Mobile WebView sessionStorage fix - override before any auth operations
if (typeof window !== 'undefined') {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
  const isWebView = window.navigator.userAgent.includes('wv');
  
  if (isMobile || isWebView) {
    console.log('🔧 Applying mobile sessionStorage fix');
    
    // Override sessionStorage to use localStorage for Firebase auth
    const originalSessionStorage = window.sessionStorage;
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: (key: string) => {
          if (key.startsWith('firebase:')) {
            return localStorage.getItem(key);
          }
          return originalSessionStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          if (key.startsWith('firebase:')) {
            return localStorage.setItem(key, value);
          }
          return originalSessionStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (key.startsWith('firebase:')) {
            return localStorage.removeItem(key);
          }
          return originalSessionStorage.removeItem(key);
        },
        clear: () => originalSessionStorage.clear(),
        key: (index: number) => originalSessionStorage.key(index),
        length: originalSessionStorage.length
      },
      writable: false,
      configurable: true
    });
  }
}

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