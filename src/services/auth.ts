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
import { nativeGoogleSignIn, isNativeAuthAvailable } from './mobileAuth';
import { robustAndroidGoogleAuth } from './enhancedAndroidAuth';
import { withTimingProtection, ensureAllSystemsReady } from './initializationManager';

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

// Enhanced timing-aware initialization checks
async function waitForCapacitorReady(maxWaitMs: number = 5000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    if (isCapacitorReady()) {
      console.log('✅ Capacitor ready after', Date.now() - startTime, 'ms');
      return true;
    }
    
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.error('❌ Capacitor not ready after', maxWaitMs, 'ms');
  return false;
}

async function waitForFirebaseReady(maxWaitMs: number = 3000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      // Check if Firebase auth is ready by accessing its properties
      if (auth && auth.app && typeof auth.currentUser !== 'undefined') {
        console.log('✅ Firebase ready after', Date.now() - startTime, 'ms');
        return true;
      }
    } catch (error) {
      // Firebase not ready yet, continue waiting
    }
    
    // Wait 50ms before checking again
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.error('❌ Firebase not ready after', maxWaitMs, 'ms');
  return false;
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
// Simplified Mobile Google Login
// -----------------------
export async function googleLogin() {
  // Use timing protection wrapper with retries
  return await withTimingProtection(async () => {
    console.log('🔍 Starting Google Auth with comprehensive timing protection...');
    
    // Ensure all systems are ready
    const systemsReady = await ensureAllSystemsReady();
    if (!systemsReady) {
      throw new Error('System initialization failed - please restart the app');
    }

    const platform = Capacitor.getPlatform();
    console.log('📱 Platform confirmed and ready:', platform);

    if (platform === 'android') {
      // Use enhanced Android authentication with better error handling
      console.log('🤖 Using enhanced Android Google authentication');
      return await robustAndroidGoogleAuth();
    } else if (isMobileNative() && isNativeAuthAvailable()) {
      // Native mobile Google sign-in for iOS
      console.log('📱 Using native Google sign-in for iOS');
      return await nativeGoogleSignIn();
    } else {
      // Web fallback - popup flow
      console.log('🌐 Using web popup flow for Google Auth');
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      console.log("✅ Web Google authentication successful:", result.user.uid);
      return { user: result.user, error: null };
    }
  }, 2); // End withTimingProtection with 2 retry attempts
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
