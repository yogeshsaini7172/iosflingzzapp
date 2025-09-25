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

// Enhanced GoogleAuth initialization
async function initializeGoogleAuthIfNeeded(): Promise<boolean> {
  if (!isMobileNative()) return true;
  
  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    await GoogleAuth.initialize();
    console.log('✅ GoogleAuth initialized for native platform');
    return true;
  } catch (error) {
    console.error('❌ GoogleAuth initialization failed:', error);
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
    if (!isCapacitorReady()) {
      throw new Error('Capacitor not ready');
    }

    const isNative = isMobileNative();
    const platform = Capacitor.getPlatform();
    
    console.log('🔍 Google Auth - Platform detection:', { 
      isNative, 
      platform,
      capacitorReady: isCapacitorReady()
    });

    if (isNative) {
      console.log('📱 Starting native Google authentication...');
      
      // Initialize GoogleAuth for native platforms
      const initialized = await initializeGoogleAuthIfNeeded();
      if (!initialized) {
        throw new Error('Failed to initialize Google Auth for native platform');
      }

      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      
      try {
        console.log('🔐 Requesting Google sign-in...');
        const googleUser = await GoogleAuth.signIn();
        
        if (!googleUser?.authentication?.idToken) {
          throw new Error('Invalid Google authentication result - missing tokens');
        }
        
        console.log('✅ Native Google sign-in successful:', {
          displayName: googleUser.name,
          email: googleUser.email
        });
        
        // Create Firebase credential from Google tokens
        const credential = GoogleAuthProvider.credential(
          googleUser.authentication.idToken,
          googleUser.authentication.accessToken
        );
        
        // Sign into Firebase with the Google credential
        const result = await signInWithCredential(auth, credential);
        console.log("✅ Firebase authentication successful:", result.user.uid);
        
        return { user: result.user, error: null };
        
      } catch (nativeError: any) {
        console.error('❌ Native Google Auth error:', nativeError);
        
        // Handle user cancellation gracefully
        if (nativeError.message?.includes('cancelled') || 
            nativeError.message?.includes('canceled') ||
            nativeError.message?.includes('CANCELLED')) {
          return { user: null, error: 'Google sign-in was cancelled.' };
        }
        
        // Handle network or service errors
        if (nativeError.message?.includes('network') || 
            nativeError.message?.includes('connection')) {
          return { user: null, error: 'Network error. Please check your connection and try again.' };
        }
        
        throw nativeError; // Re-throw for outer error handler
      }
    } else {
      console.log('🌐 Starting web Google authentication...');
      
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
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        await GoogleAuth.signOut();
        console.log('✅ Native Google Auth sign out completed');
      } catch (e) {
        console.warn('⚠️ Native Google Auth sign out failed:', e);
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
