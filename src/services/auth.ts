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
  try {
    console.log('🔍 Starting Google Auth for mobile...');
    
    if (!isCapacitorReady()) {
      throw new Error('Capacitor not ready - restart the app');
    }

    const platform = Capacitor.getPlatform();
    console.log('📱 Platform:', platform);

    // For mobile, use phone authentication as primary method
    if (isMobileNative()) {
      console.log('📱 Mobile detected - Google Auth may have limitations in WebView');
      console.log('💡 Recommend using phone authentication for mobile');
      
      return { 
        user: null, 
        error: 'Google authentication is not available on mobile. Please use phone number authentication for the best experience.' 
      };
    } else {
      // Web fallback
      console.log('🌐 Web platform - using popup flow');
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      console.log("✅ Web Google authentication successful:", result.user.uid);
      
      return { user: result.user, error: null };
    }
    
  } catch (error: any) {
    console.error("❌ Google authentication failed:", {
      code: error.code,
      message: error.message,
      platform: Capacitor.getPlatform()
    });
    
    if (error.code === 'auth/popup-blocked') {
      return { user: null, error: 'Popup was blocked. Please allow popups and try again.' };
    } else if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Google sign-in was cancelled.' };
    } else {
      return { user: null, error: 'For mobile devices, please use phone number authentication.' };
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
