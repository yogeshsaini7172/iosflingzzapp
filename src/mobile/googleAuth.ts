import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Initialize GoogleAuth plugin when appropriate
export function initializeGoogleAuth() {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      // Initialize for web builds; native auto-initializes via plugin
      GoogleAuth.initialize();
    }
    console.log("✅ Google Auth plugin initialized");
  } catch (e) {
    console.warn('⚠️ GoogleAuth init skipped:', e);
  }
}

// Real login function for Google
export async function googleLogin() {
  try {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log("✅ Google login success:", result.user.uid);
    return result.user;
  } catch (error: any) {
    console.error("❌ Google login failed:", error.message);
    throw error;
  }
}
