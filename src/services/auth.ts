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
        console.log('🔧 GoogleAuth plugin status check:', {
          pluginAvailable: !!GoogleAuth,
          methods: Object.getOwnPropertyNames(GoogleAuth),
          isInitialized: true // We just initialized it above
        });
        
        // Add timeout to prevent hanging
        const signInPromise = GoogleAuth.signIn();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Google sign-in timed out after 30 seconds')), 30000)
        );
        
        console.log('⏱️ Waiting for Google sign-in response...');
        const googleUser = await Promise.race([signInPromise, timeoutPromise]) as any;
        
        console.log('📋 Google sign-in response received:', {
          responseType: typeof googleUser,
          hasUser: !!googleUser,
          isNull: googleUser === null,
          isUndefined: googleUser === undefined,
          hasAuth: !!googleUser?.authentication,
          hasIdToken: !!googleUser?.authentication?.idToken,
          hasAccessToken: !!googleUser?.authentication?.accessToken,
          email: googleUser?.email,
          name: googleUser?.name,
          keys: googleUser ? Object.keys(googleUser) : 'No keys - null/undefined'
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
        // Enhanced error logging for empty/malformed error objects
        console.error('❌ Native Google Auth error details:', {
          errorType: typeof nativeError,
          errorString: String(nativeError),
          errorJSON: JSON.stringify(nativeError, null, 2),
          message: nativeError?.message,
          code: nativeError?.code,
          hasKeys: Object.keys(nativeError || {}).length,
          keys: Object.keys(nativeError || {})
        });
        
        // Handle empty or malformed error objects
        if (!nativeError || (typeof nativeError === 'object' && Object.keys(nativeError).length === 0)) {
          console.error('❌ Empty error object detected - likely plugin communication issue');
          return { user: null, error: 'Google sign-in failed due to a plugin communication issue. Please restart the app and try again.' };
        }
        
        const errorMessage = nativeError?.message || nativeError?.toString() || 'Unknown error';
        
        // Handle specific error cases with better messaging
        if (errorMessage.includes('cancelled') || 
            errorMessage.includes('canceled') ||
            errorMessage.includes('CANCELLED') ||
            errorMessage.includes('User cancelled')) {
          return { user: null, error: 'Google sign-in was cancelled.' };
        }
        
        if (errorMessage.includes('network') || 
            errorMessage.includes('connection') ||
            errorMessage.includes('Network')) {
          return { user: null, error: 'Network error. Please check your connection and try again.' };
        }
        
        if (errorMessage.includes('Something went wrong')) {
          return { user: null, error: 'Google services error. Please restart the app and try again.' };
        }
        
        if (errorMessage.includes('timeout')) {
          return { user: null, error: 'Google sign-in timed out. Please try again.' };
        }
        
        if (errorMessage.includes('not ready') || 
            errorMessage.includes('initialize')) {
          return { user: null, error: 'Google services not ready. Please restart the app and try again.' };
        }
        
        // Handle the specific "Something went wrong" case that appears as empty object
        if (errorMessage === '[object Object]' || errorMessage === 'Unknown error') {
          return { user: null, error: 'Google authentication encountered an issue. Please restart the app and try again.' };
        }
        
        // Generic fallback with more helpful message
        return { user: null, error: `Google authentication failed: ${errorMessage}. Please try restarting the app.` };
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
