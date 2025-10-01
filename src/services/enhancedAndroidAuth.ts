import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { ensureAllSystemsReady } from './initializationManager';

/**
 * ENHANCED ANDROID GOOGLE AUTH DIAGNOSTICS & FIX
 * This module specifically addresses "no credential" errors on Android
 */

// Enhanced debugging for Android authentication issues
export async function diagnoseAndroidAuth() {
  console.log('🔍 === ANDROID AUTH DIAGNOSTICS ===');
  
  const diagnostics = {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform(),
    capacitorAvailable: typeof Capacitor !== 'undefined',
    userAgent: navigator.userAgent,
  };
  
  console.log('📱 Platform Info:', diagnostics);
  
  // Check if Firebase Authentication plugin is properly loaded
  try {
    // Try to access the plugin to see if it's available
    const pluginTest = await FirebaseAuthentication.getCurrentUser();
    console.log('🔥 Firebase Authentication plugin is available');
  } catch (error) {
    console.error('❌ Firebase Authentication plugin error:', error);
    return {
      success: false,
      error: 'Firebase Authentication plugin not properly configured',
      diagnostics
    };
  }
  
  // Check configuration
  console.log('⚙️ Checking Configuration...');
  
  // Get current user if any
  try {
    const result = await FirebaseAuthentication.getCurrentUser();
    console.log('👤 Current User:', result.user ? 'Logged in' : 'Not logged in');
  } catch (error) {
    console.warn('⚠️ Could not get current user:', error);
  }
  
  return {
    success: true,
    diagnostics
  };
}

// Enhanced native Google sign-in with better error handling
// Wait for Firebase Authentication plugin to be ready
async function waitForFirebaseAuthPlugin(maxWaitMs: number = 3000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      // Try to access the plugin to see if it's loaded
      await FirebaseAuthentication.getCurrentUser();
      console.log('✅ Firebase Auth plugin ready after', Date.now() - startTime, 'ms');
      return true;
    } catch (error) {
      // Plugin not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.error('❌ Firebase Auth plugin not ready after', maxWaitMs, 'ms');
  return false;
}

export async function enhancedNativeGoogleSignIn() {
  try {
    console.log('🚀 Starting Enhanced Native Google Sign-In with comprehensive timing fixes...');
    
    // Step 0: Ensure all systems are ready using the initialization manager
    console.log('⏳ Ensuring all systems are ready...');
    const systemsReady = await ensureAllSystemsReady();
    if (!systemsReady) {
      throw new Error('System initialization failed - please restart the app');
    }
    
    // Step 1: Run diagnostics first
    console.log('🔍 Running diagnostics...');
    const diagResult = await diagnoseAndroidAuth();
    if (!diagResult.success) {
      throw new Error(diagResult.error);
    }
    
    // Step 2: Clear any existing auth state
    console.log('🧹 Clearing existing auth state...');
    try {
      await FirebaseAuthentication.signOut();
    } catch (e) {
      console.log('ℹ️ No existing session to clear');
    }
    
    // Step 3: Verify we're on a native platform
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Native Google Sign-In only available on native platforms');
    }
    
    console.log('✅ Native platform confirmed');
    
    // Step 4: Perform native sign-in with enhanced error handling
    console.log('🔄 Initiating native Google sign-in...');
    const result = await FirebaseAuthentication.signInWithGoogle();
    
    console.log('📱 Native sign-in raw result:', {
      hasUser: !!result.user,
      hasCredential: !!result.credential,
      hasIdToken: !!result.credential?.idToken,
      hasAccessToken: !!result.credential?.accessToken,
      userId: result.user?.uid
    });
    
    // Step 5: Validate we have the necessary credentials
    if (!result.credential?.idToken) {
      // Try to get the ID token separately
      console.log('🔄 Attempting to retrieve ID token...');
      try {
        const tokenResult = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
        console.log('🔑 Retrieved ID token separately:', !!tokenResult.token);
        
        if (tokenResult.token) {
          // Create credential with the retrieved token
          const credential = GoogleAuthProvider.credential(
            tokenResult.token,
            result.credential?.accessToken
          );
          const userCredential = await signInWithCredential(auth, credential);
          console.log('✅ Successfully signed in with retrieved token:', userCredential.user.uid);
          return { user: userCredential.user, error: null };
        }
      } catch (tokenError) {
        console.error('❌ Failed to retrieve ID token:', tokenError);
      }
      
      throw new Error('No ID token received from Google Sign-In. This indicates a configuration issue with your Firebase project or Google Services.');
    }
    
    // Step 6: Bridge to Firebase Web SDK
    console.log('🌉 Bridging credentials to Firebase Web SDK...');
    const credential = GoogleAuthProvider.credential(
      result.credential.idToken,
      result.credential.accessToken
    );
    
    const userCredential = await signInWithCredential(auth, credential);
    console.log('✅ Enhanced native Google sign-in successful:', userCredential.user.uid);
    
    return { user: userCredential.user, error: null };
    
  } catch (error: any) {
    console.error('❌ Enhanced native Google sign-in failed:', error);
    
    // Provide specific error messages based on error type
    let errorMessage = 'Google sign-in failed';
    
    if (error.message?.includes('No ID token')) {
      errorMessage = 'Authentication configuration error. Please check your Firebase project settings and SHA-1 fingerprints.';
    } else if (error.message?.includes('not available')) {
      errorMessage = 'Google Sign-In not available on this device. Please ensure Google Play Services is installed and updated.';
    } else if (error.code === '10') {
      errorMessage = 'Google Sign-In configuration error. Check your SHA-1 fingerprints in Firebase Console.';
    } else if (error.code === '7') {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.message?.includes('DEVELOPER_ERROR')) {
      errorMessage = 'Configuration error: Incorrect SHA-1 fingerprint or package name mismatch.';
    }
    
    return { user: null, error: errorMessage };
  }
}

// Alternative: Web-based Google Sign-In for Android WebView
export async function webGoogleSignInForAndroid() {
  try {
    console.log('🌐 Attempting web-based Google Sign-In for Android...');
    
    const { signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    
    // Add Android-specific parameters
    provider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'online',
      include_granted_scopes: 'true'
    });
    
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Web Google sign-in successful:', result.user.uid);
    
    return { user: result.user, error: null };
    
  } catch (error: any) {
    console.error('❌ Web Google sign-in failed:', error);
    return { user: null, error: error.message };
  }
}

// Main authentication function with fallbacks
export async function robustAndroidGoogleAuth() {
  console.log('🎯 Starting Robust Android Google Authentication...');
  
  if (!Capacitor.isNativePlatform()) {
    console.log('🌐 Not on native platform, using web auth');
    return await webGoogleSignInForAndroid();
  }
  
  // Try native authentication first
  console.log('📱 Attempting native authentication...');
  const nativeResult = await enhancedNativeGoogleSignIn();
  
  if (nativeResult.user) {
    return nativeResult;
  }
  
  // If native fails, try web fallback
  console.log('🔄 Native auth failed, trying web fallback...');
  const webResult = await webGoogleSignInForAndroid();
  
  if (webResult.user) {
    return webResult;
  }
  
  // Both methods failed
  return {
    user: null,
    error: `Authentication failed. Native error: ${nativeResult.error}. Web error: ${webResult.error}`
  };
}