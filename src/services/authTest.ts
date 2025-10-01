import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

/**
 * Simple Google authentication test function
 * This bypasses all the complex logic to test basic Firebase connectivity
 */
export async function simpleGoogleAuth() {
  try {
    console.log('🧪 Testing simple Google authentication...');
    
    // Create the simplest possible provider
    const provider = new GoogleAuthProvider();
    
    console.log('🔄 Attempting basic signInWithPopup...');
    const result = await signInWithPopup(auth, provider);
    
    console.log('✅ Simple auth succeeded:', result.user.email);
    return { user: result.user, error: null };
    
  } catch (error: any) {
    console.error('❌ Simple auth failed:', error.code, error.message);
    
    // If it's a network error, the problem is deeper
    if (error.code === 'auth/network-request-failed') {
      console.error('🚨 Network connectivity issue detected');
      console.error('This suggests either:');
      console.error('1. No internet connection');
      console.error('2. Firebase project configuration issue');
      console.error('3. Android network security policy blocking requests');
      console.error('4. Emulator network restrictions');
    }
    
    return { user: null, error: error.message || 'Authentication failed' };
  }
}

/**
 * Test Firebase connectivity
 */
export async function testFirebaseConnectivity() {
  try {
    console.log('🧪 Testing Firebase connectivity...');
    
    // Try to access Firebase Auth service
    const currentUser = auth.currentUser;
    console.log('🔍 Current auth state:', currentUser ? 'User logged in' : 'No user');
    
    // Try to trigger any Firebase operation to test connectivity
    try {
      await auth.signOut(); // This should work even if no user is signed in
      console.log('✅ Firebase Auth service is accessible');
      return { connected: true, error: null };
    } catch (fbError: any) {
      console.error('❌ Firebase Auth service error:', fbError);
      return { connected: false, error: fbError.message };
    }
    
  } catch (error: any) {
    console.error('❌ Firebase connectivity test failed:', error);
    return { connected: false, error: error.message };
  }
}