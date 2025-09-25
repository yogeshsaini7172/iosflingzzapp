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
// Google Login (Native Mobile + Web)
// -----------------------
export async function googleLogin() {
  try {
    const isCapacitor = Capacitor.isNativePlatform();
    
    console.log('🔍 Auth environment:', { 
      isCapacitor,
      platform: Capacitor.getPlatform()
    });

    // For now, use web auth for all platforms until native is properly configured
    console.log('🌐 Using web popup auth...');
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log("✅ Google login success:", result.user.uid);
    return { user: result.user, error: null };
    
  } catch (error: any) {
    console.error("❌ Google Login Failed:", error.code, error.message);
    
    if (error.code === 'auth/popup-blocked') {
      return { user: null, error: 'Popup was blocked. Please allow popups and try again.' };
    } else if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Sign-in was cancelled.' };
    } else if (error.code === 'auth/network-request-failed') {
      return { user: null, error: 'Network error. Please check your connection and try again.' };
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
