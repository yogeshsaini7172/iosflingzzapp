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

// Enhanced GoogleAuth initialization with detailed error handling
async function initializeGoogleAuthIfNeeded(): Promise<boolean> {
  if (!isMobileNative()) return true;
  
  try {
    console.log('🔄 Initializing GoogleAuth for native platform...');
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    
    // Check if already initialized
    try {
      await GoogleAuth.initialize({
        clientId: '533305529581-frij9q3gtu1jkj7hb3rtpqqsqb1mltkf.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      console.log('✅ GoogleAuth initialized successfully');
      return true;
    } catch (initError: any) {
      console.error('❌ GoogleAuth initialization error:', {
        message: initError.message,
        code: initError.code,
        details: initError
      });
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to import GoogleAuth plugin:', error);
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
        
        // Add timeout to prevent hanging
        const signInPromise = GoogleAuth.signIn();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Google sign-in timed out after 30 seconds')), 30000)
        );
        
        const googleUser = await Promise.race([signInPromise, timeoutPromise]) as any;
        
        console.log('📋 Google sign-in response:', {
          hasUser: !!googleUser,
          hasAuth: !!googleUser?.authentication,
          hasIdToken: !!googleUser?.authentication?.idToken,
          hasAccessToken: !!googleUser?.authentication?.accessToken,
          email: googleUser?.email,
          name: googleUser?.name
        });
        
        if (!googleUser) {
          throw new Error('No user returned from Google sign-in');
        }
        
        if (!googleUser.authentication) {
          throw new Error('No authentication tokens returned from Google sign-in');
        }
        
        if (!googleUser.authentication.idToken) {
          throw new Error('Missing ID token from Google authentication');
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
        console.error('❌ Native Google Auth error:', {
          message: nativeError.message || 'Unknown error',
          code: nativeError.code,
          error: nativeError
        });
        
        // Handle specific error cases with better messaging
        if (nativeError.message?.includes('cancelled') || 
            nativeError.message?.includes('canceled') ||
            nativeError.message?.includes('CANCELLED') ||
            nativeError.message?.includes('User cancelled')) {
          return { user: null, error: 'Google sign-in was cancelled.' };
        }
        
        if (nativeError.message?.includes('network') || 
            nativeError.message?.includes('connection') ||
            nativeError.message?.includes('Network')) {
          return { user: null, error: 'Network error. Please check your connection and try again.' };
        }
        
        if (nativeError.message?.includes('Something went wrong')) {
          return { user: null, error: 'Google services error. Please try again or use phone authentication.' };
        }
        
        if (nativeError.message?.includes('timeout')) {
          return { user: null, error: 'Google sign-in timed out. Please try again.' };
        }
        
        if (nativeError.message?.includes('not ready') || 
            nativeError.message?.includes('initialize')) {
          return { user: null, error: 'Google services not ready. Please restart the app and try again.' };
        }
        
        // Generic fallback with more helpful message
        return { user: null, error: `Google authentication failed: ${nativeError.message || 'Unknown error'}. Please try phone authentication instead.` };
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
