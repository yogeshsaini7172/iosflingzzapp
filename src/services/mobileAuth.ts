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

    // Native Google sign-in - shows overlay within app
    const result = await FirebaseAuthentication.signInWithGoogle();
    
    console.log('✅ Native Google sign-in successful:', result.user?.uid);
    
    // Create credential and sign in with Firebase
    const credential = GoogleAuthProvider.credential(
      result.credential?.idToken,
      result.credential?.accessToken
    );
    
    const userCredential = await signInWithCredential(auth, credential);
    console.log('✅ Firebase credential sign-in successful:', userCredential.user.uid);
    
    return { user: userCredential.user, error: null };
    
  } catch (error: any) {
    console.error('❌ Native Google sign-in failed:', error);
    return { user: null, error: error.message || 'Google sign-in failed' };
  }
}

// Check if native auth is available
export function isNativeAuthAvailable(): boolean {
  return Capacitor.isNativePlatform();
}