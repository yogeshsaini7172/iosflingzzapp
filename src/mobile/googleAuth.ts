import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Initialize GoogleAuth plugin for all platforms
export function initializeGoogleAuth() {
  try {
    console.log('🔧 Initializing GoogleAuth plugin...');
    GoogleAuth.initialize();
    console.log("✅ Google Auth plugin initialized successfully");
  } catch (e) {
    console.warn('⚠️ GoogleAuth initialization failed:', e);
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
