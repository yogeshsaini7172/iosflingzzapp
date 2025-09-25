import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { Capacitor } from "@capacitor/core";

// Mobile auth detection and utilities
function isMobileNative(): boolean {
  return Capacitor.isNativePlatform() || 
         ['android', 'ios'].includes(Capacitor.getPlatform());
}

function isCapacitorReady(): boolean {
  try {
    return typeof Capacitor !== 'undefined' && 
           typeof Capacitor.getPlatform === 'function';
  } catch {
    return false;
  }
}

// Enhanced Firebase Auth initialization for Capacitor
async function initializeGoogleAuthIfNeeded(): Promise<boolean> {
  if (!isMobileNative()) return true;
  
  try {
    console.log('🔄 Initializing Firebase Auth for native platform...');
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    console.log('✅ Firebase Auth plugin ready');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to import Firebase Auth plugin:', error);
    return false;
  }
}

// -----------------------
// Email/Password Login
// -----------------------
export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Email login success:", userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("❌ Email login failed:", error.message);
    return { user: null, error: error.message };
  }
}

// -----------------------
// Email/Password Signup
// -----------------------
export async function signup(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ Email signup success:", userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("❌ Email signup failed:", error.message);
    return { user: null, error: error.message };
  }
}

// -----------------------
// Enhanced Google Login (Native + Web)
// -----------------------
export async function googleLogin() {
  try {
    console.log('🔍 Starting Google Auth for mobile...');
    
    if (!isCapacitorReady()) {
      throw new Error('Capacitor not ready - restart the app');
    }

    const platform = Capacitor.getPlatform();
    console.log('📱 Platform:', platform);
    // Initialize GoogleAuth for mobile
    const initialized = await initializeGoogleAuthIfNeeded();
    if (!initialized) {
      throw new Error('Failed to initialize Google Auth - please restart the app');
    }

    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      
      try {
        console.log('🔐 Requesting Google sign-in...');
        
        const result = await FirebaseAuthentication.signInWithGoogle();
        
        console.log('📋 Google sign-in response:', {
          hasUser: !!result.user,
          hasCredential: !!result.credential,
          email: result.user?.email
        });
        
        if (!result.user) {
          throw new Error('Google sign-in failed - no user returned');
        }
        
        console.log('✅ Google sign-in successful:', result.user.email);
        
        // The user is already authenticated with Firebase through the plugin
        // Get the current Firebase user
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          return { user: firebaseUser, error: null };
        } else {
          throw new Error('Firebase user not found after authentication');
        }
        
      } catch (nativeError: any) {
        console.error('❌ Google Auth error:', nativeError);
        
        const errorMessage = nativeError?.message || 'Unknown error';
        
        if (errorMessage.includes('cancelled') || errorMessage.includes('canceled')) {
          return { user: null, error: 'Google sign-in was cancelled.' };
        }
        
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          return { user: null, error: 'Network error. Please check connection and try again.' };
        }
        
        return { user: null, error: `Authentication failed: ${errorMessage}` };
      }
    
  } catch (error: any) {
    console.error("❌ Google authentication failed:", {
      code: error.code,
      message: error.message,
      platform: Capacitor.getPlatform()
    });
    
    // Enhanced error handling with specific messages
    if (error.code === 'auth/popup-blocked') {
      return { user: null, error: 'Popup was blocked. Please allow popups and try again.' };
    } else if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Google sign-in was cancelled.' };
    } else if (error.code === 'auth/network-request-failed') {
      return { user: null, error: 'Network error. Please check your connection and try again.' };
    } else if (error.code === 'auth/internal-error') {
      return { user: null, error: 'Authentication service error. Please try again later.' };
    } else if (error.code === 'auth/invalid-api-key') {
      return { user: null, error: 'Configuration error. Please contact support.' };
    } else if (error.message?.includes('Google Auth')) {
      return { user: null, error: 'Google authentication service is not available. Please try phone authentication.' };
    } else {
      return { user: null, error: error.message || 'Authentication failed. Please try again.' };
    }
  }
}

// -----------------------
// Phone Login (OTP) with Mobile Optimization
// -----------------------
export async function phoneLogin(phoneNumber: string) {
  try {
    console.log('📱 Starting phone authentication for:', phoneNumber);
    
    // Create reCAPTCHA container if it doesn't exist
    let recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) {
      recaptchaContainer = document.createElement('div');
      recaptchaContainer.id = 'recaptcha-container';
      recaptchaContainer.style.position = 'fixed';
      recaptchaContainer.style.top = '-1000px';
      recaptchaContainer.style.visibility = 'hidden';
      document.body.appendChild(recaptchaContainer);
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        console.log("✅ reCAPTCHA solved successfully");
      },
      'expired-callback': () => {
        console.warn("⚠️ reCAPTCHA expired");
      }
    });

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log("✅ SMS verification code sent successfully");
    
    return { confirmationResult, error: null };
  } catch (error: any) {
    console.error("❌ Phone authentication failed:", error.message);
    return { confirmationResult: null, error: error.message };
  }
}

// -----------------------
// Verify OTP
// -----------------------
export async function verifyOTP(confirmationResult: any, otp: string) {
  try {
    const userCredential = await confirmationResult.confirm(otp);
    console.log("✅ Phone verification successful:", userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("❌ OTP verification failed:", error.message);
    return { user: null, error: error.message };
  }
}

// -----------------------
// Enhanced Sign out with cleanup
// -----------------------
export async function signOut() {
  try {
    // Clean up any mobile-specific auth state
    if (isMobileNative()) {
      try {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        await FirebaseAuthentication.signOut();
        console.log('✅ Firebase Auth sign out completed');
      } catch (e) {
        console.warn('⚠️ Firebase Auth sign out failed:', e);
      }
    }
    
    await firebaseSignOut(auth);
    console.log("✅ Firebase sign out successful");
    return { error: null };
  } catch (error: any) {
    console.error("❌ Sign out failed:", error.message);
    return { error: error.message };
  }
}

// -----------------------
// Auth state listener
// -----------------------
export function watchAuthState(callback: (user: any) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ User authenticated:", user.uid);
    } else {
      console.log("🔓 User signed out");
    }
    callback(user);
  });
}
