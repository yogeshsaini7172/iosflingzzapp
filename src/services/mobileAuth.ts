import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// Detect mobile environment for debugging
export function detectMobileEnvironment() {
  return {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform(),
    isCapacitor: typeof Capacitor !== 'undefined',
    userAgent: navigator.userAgent,
    supports: {
      GoogleAuth: Capacitor.isNativePlatform(),
      storage: typeof Storage !== 'undefined',
      notifications: 'Notification' in window
    }
  };
}

// Clean up mobile auth state
export async function cleanupMobileAuthState() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 Mobile auth state cleaned');
  } catch (error) {
    console.error('❌ Failed to cleanup auth state:', error);
  }
}

// Proper Mobile Google Authentication
export async function nativeGoogleSignIn() {
  try {
    console.log('🔍 Starting native Google sign-in...');

    if (!Capacitor.isNativePlatform()) {
      throw new Error('Native auth only available on mobile platforms');
    }

    // 1) Trigger native Google sign-in (Capawesome plugin)
    const result = await FirebaseAuthentication.signInWithGoogle();
    console.log('📲 Native sign-in result user:', result.user?.uid);

    // 2) Ensure we have an ID token to bridge into the Web SDK
    let idToken = result.credential?.idToken ?? null;
    const accessToken = result.credential?.accessToken ?? null;

    if (!idToken && result.user) {
      // Try to fetch an ID token from the native Firebase user
      try {
        const tokenRes = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
        idToken = tokenRes.token ?? null;
        console.log('🔐 Retrieved ID token from native user:', Boolean(idToken));
      } catch (e) {
        console.warn('⚠️ Failed to retrieve ID token from native user:', e);
      }
    }

    if (!idToken) {
      throw new Error(
        'No credentials available. Ensure google.serverClientId is set, SHA-1/256 are added in Firebase, then rebuild & npx cap sync android.'
      );
    }

    // 3) Bridge native credentials into Firebase Web SDK
    const credential = GoogleAuthProvider.credential(idToken, accessToken || undefined);
    const userCredential = await signInWithCredential(auth, credential);
    console.log('✅ Firebase Web SDK sign-in successful:', userCredential.user.uid);

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('❌ Native Google sign-in failed:', error);
    return { user: null, error: error?.message || 'Google sign-in failed' };
  }
}

// Check if native auth is available
export function isNativeAuthAvailable(): boolean {
  return Capacitor.isNativePlatform();
}