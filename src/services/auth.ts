import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { Capacitor } from "@capacitor/core";

// -----------------------
// Email/Password Login
// -----------------------
export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login Success:", userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("Login Failed:", error.message);
    return { user: null, error: error.message };
  }
}

// -----------------------
// Email/Password Signup
// -----------------------
export async function signup(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Signup Success:", userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("Signup Failed:", error.message);
    return { user: null, error: error.message };
  }
}

// -----------------------
// Storage Detection Helper
// -----------------------
function isSessionStorageAvailable(): boolean {
  try {
    const testKey = '__firebase_test__';
    sessionStorage.setItem(testKey, '1');
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('⚠️ sessionStorage not available:', e);
    return false;
  }
}

// -----------------------
// Google Login (Web & Mobile via Firebase SDK)
// -----------------------
export async function googleLogin() {
  try {
    // Check if we're in a problematic environment
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isWebView = navigator.userAgent.includes('wv') || navigator.userAgent.includes('WebView');
    const hasSessionStorage = isSessionStorageAvailable();
    const isCapacitor = Capacitor.isNativePlatform();
    
    console.log('🔍 Auth environment check:', { 
      isMobile, 
      isWebView, 
      hasSessionStorage,
      isCapacitor,
      platform: Capacitor.getPlatform(),
      userAgent: navigator.userAgent 
    });

    // First, check if we have a pending redirect result
    console.log('🔍 Checking for pending redirect result...');
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult) {
      console.log("✅ Google login success from redirect:", redirectResult.user.uid);
      return { user: redirectResult.user, error: null };
    }

    // Try popup first, fallback to redirect if needed
    if (isCapacitor) {
      console.log('⚠️ Capacitor environment detected, trying popup first...');
      try {
        console.log('🚀 Attempting signInWithPopup in Capacitor...');
        const result = await signInWithPopup(auth, googleProvider);
        console.log("✅ Google login success:", result.user.uid);
        return { user: result.user, error: null };
      } catch (popupError: any) {
        console.log('⚠️ Popup failed in Capacitor, falling back to redirect...');
        console.log('🚀 Starting signInWithRedirect for Google authentication...');
        await signInWithRedirect(auth, googleProvider);
        return { user: null, error: 'redirecting' };
      }
    } else if (!hasSessionStorage || isWebView) {
      console.log('⚠️ Using redirect-based auth for WebView environment');
      console.log('🚀 Starting signInWithRedirect for Google authentication...');
      await signInWithRedirect(auth, googleProvider);
      return { user: null, error: 'redirecting' };
    } else {
      // Use popup for desktop/regular browsers
      console.log('🚀 Using signInWithPopup for desktop authentication...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log("✅ Google login success:", result.user.uid);
      return { user: result.user, error: null };
    }
    
  } catch (error: any) {
    console.error("❌ Google Login Failed:", error.code, error.message);
    
    // Enhanced error handling for common mobile issues
    if (error.code === 'auth/popup-blocked') {
      // Fallback to redirect if popup is blocked
      console.log('🔄 Popup blocked, falling back to redirect...');
      try {
        await signInWithRedirect(auth, googleProvider);
        return { user: null, error: 'redirecting' };
      } catch (redirectError: any) {
        return { user: null, error: 'Authentication failed. Please try again.' };
      }
    } else if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Sign-in was cancelled. Please try again.' };
    } else if (error.code === 'auth/network-request-failed') {
      console.log('🔄 Network error detected, trying alternative approach...');
      try {
        // Wait and retry with a fresh provider
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create minimal provider configuration
        const simpleProvider = new GoogleAuthProvider();
        simpleProvider.addScope('email');
        simpleProvider.addScope('profile');
        
        // Clear any auth state and retry
        await auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryResult = await signInWithPopup(auth, simpleProvider);
        console.log("✅ Google login success on network retry:", retryResult.user.uid);
        return { user: retryResult.user, error: null };
        
      } catch (retryError: any) {
        console.error("❌ Network retry also failed:", retryError);
        return { 
          user: null, 
          error: 'Authentication service unavailable. Please check your internet connection and restart the app.' 
        };
      }
    } else if (error.code === 'auth/internal-error') {
      console.log('🔄 Internal error, trying redirect method...');
      try {
        await signInWithRedirect(auth, googleProvider);
        return { user: null, error: 'redirecting' };
      } catch (redirectError: any) {
        return { user: null, error: 'Authentication failed. Please restart the app and try again.' };
      }
    } else {
      return { user: null, error: error.message || 'Authentication failed. Please try again.' };
    }
  }
}

// -----------------------
// Phone Login (OTP)
// -----------------------
export async function phoneLogin(phoneNumber: string) {
  try {
    const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        console.log("reCAPTCHA solved");
      },
    });

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log("OTP sent successfully");
    return { confirmationResult, error: null };
  } catch (error: any) {
    console.error("Phone Login Failed:", error.message);
    return { confirmationResult: null, error: error.message };
  }
}

// -----------------------
// Verify OTP
// -----------------------
export async function verifyOTP(confirmationResult: any, otp: string) {
  try {
    const userCredential = await confirmationResult.confirm(otp);
    console.log("OTP Verification Success:", userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("OTP Verification Failed:", error.message);
    return { user: null, error: error.message };
  }
}

// -----------------------
// Sign out
// -----------------------
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    console.log("Sign out successful");
    return { error: null };
  } catch (error: any) {
    console.error("Sign out failed:", error.message);
    return { error: error.message };
  }
}

// -----------------------
// Auth state listener
// -----------------------
export function watchAuthState(callback: (user: any) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User logged in:", user.uid);
    } else {
      console.log("User logged out");
    }
    callback(user);
  });
}
