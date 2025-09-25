import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

// Fake initializer (keeps main.tsx happy)
export function initializeGoogleAuth() {
  console.log("✅ Firebase Google Auth initialized");
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
