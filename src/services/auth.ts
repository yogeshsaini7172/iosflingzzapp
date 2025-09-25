import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, signInWithPhoneNumber, RecaptchaVerifier, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../firebase";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Email/Password Login
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

// Email/Password Signup
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

// Google Login (Capacitor / Mobile)
export async function googleLogin() {
  try {
    if (Capacitor.isNativePlatform()) {
      // Mobile/Native platform
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      const result = await signInWithCredential(auth, credential);
      console.log("Google login success:", result.user.uid);
      return { user: result.user, error: null };
    } else {
      // Web platform - this will be handled differently
      throw new Error("Google auth not supported on web in this implementation");
    }
  } catch (error: any) {
    console.error("Google Login Failed:", error.message);
    return { user: null, error: error.message };
  }
}

// Phone Login
export async function phoneLogin(phoneNumber: string) {
  try {
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      }
    });

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log("OTP sent successfully");
    return { confirmationResult, error: null };
  } catch (error: any) {
    console.error("Phone Login Failed:", error.message);
    return { confirmationResult: null, error: error.message };
  }
}

// Verify OTP
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

// Sign out
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    console.log("Sign out successful");
    return { error: null };
  } catch (error: any) {
    console.error("Sign out failed:", error.message);
    return { error: error.message };
  }
}

// Auth state listener
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