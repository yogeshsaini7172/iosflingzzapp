import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { ensureAllSystemsReady } from './initializationManager';
import { 
  isCredentialManagerError, 
  getCredentialManagerErrorMessage,
  detectCredentialManagerSupport 
} from './androidCredentialManagerFix';

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
    console.log('🚀 Starting Hybrid Google Sign-In (Credential Manager → Web Fallback)...');
    
    // Step 0: Check credential manager support FIRST (quick check)
    console.log('🔍 Checking Credential Manager support...');
    const credentialSupport = await detectCredentialManagerSupport();
    console.log('📱 Credential Manager:', credentialSupport.isSupported ? '✅ Available' : '❌ Not Available');
    
    if (!credentialSupport.isSupported) {
      console.log('⚠️ Credential Manager not supported - immediate fallback to web method');
      console.log('💡 Reason:', credentialSupport.reason);
      throw new Error('CREDENTIAL_MANAGER_NOT_SUPPORTED');
    }
    
    // Step 1: Ensure all systems are ready
    console.log('⏳ Initializing authentication systems...');
    const systemsReady = await ensureAllSystemsReady();
    if (!systemsReady) {
      console.log('❌ System initialization failed - falling back to web method');
      throw new Error('CREDENTIAL_MANAGER_NOT_SUPPORTED');
    }
    
    // Step 2: Run diagnostics first
    console.log('🔍 Running diagnostics...');
    const diagResult = await diagnoseAndroidAuth();
    if (!diagResult.success) {
      throw new Error(diagResult.error);
    }
    
    // Step 3: Clear any existing auth state
    console.log('🧹 Clearing existing auth state...');
    try {
      await FirebaseAuthentication.signOut();
    } catch (e) {
      console.log('ℹ️ No existing session to clear');
    }
    
    // Step 4: Verify we're on a native platform
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Native Google Sign-In only available on native platforms');
    }
    
    console.log('✅ Native platform confirmed');
    
    // Step 5: Perform native sign-in with enhanced error handling
    console.log('🔄 Initiating native Google sign-in...');
    const result = await FirebaseAuthentication.signInWithGoogle();
    
    console.log('📱 Native sign-in raw result:', {
      hasUser: !!result.user,
      hasCredential: !!result.credential,
      hasIdToken: !!result.credential?.idToken,
      hasAccessToken: !!result.credential?.accessToken,
      userId: result.user?.uid
    });
    
    // Step 6: Validate we have the necessary credentials
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
    
    // Step 7: Bridge to Firebase Web SDK
    console.log('🌉 Bridging credentials to Firebase Web SDK...');
    const credential = GoogleAuthProvider.credential(
      result.credential.idToken,
      result.credential.accessToken
    );
    
    const userCredential = await signInWithCredential(auth, credential);
    console.log('✅ Enhanced native Google sign-in successful:', userCredential.user.uid);
    
    return { user: userCredential.user, error: null };
    
  } catch (error: any) {
    console.error('❌ Native Google sign-in failed:', error);
    
    // Immediate fallback for credential manager issues
    if (error.message === 'CREDENTIAL_MANAGER_NOT_SUPPORTED' || isCredentialManagerError(error)) {
      console.log('🔄 Falling back to web authentication method...');
      return { 
        user: null, 
        error: 'CREDENTIAL_MANAGER_NOT_SUPPORTED',
        shouldFallbackToWeb: true 
      };
    }
    
    // Handle other specific errors with user-friendly messages
    let errorMessage = 'Authentication failed';
    
    if (error.message?.includes('No ID token')) {
      errorMessage = 'Configuration error. Please try again or use phone authentication.';
    } else if (error.message?.includes('not available')) {
      errorMessage = 'Google Sign-In not available. Trying alternative method...';
      // Also trigger fallback for this case
      return { 
        user: null, 
        error: 'CREDENTIAL_MANAGER_NOT_SUPPORTED',
        shouldFallbackToWeb: true 
      };
    } else if (error.code === '10' || error.code === '7') {
      errorMessage = 'Connection error. Trying alternative sign-in method...';
      return { 
        user: null, 
        error: 'CREDENTIAL_MANAGER_NOT_SUPPORTED',
        shouldFallbackToWeb: true 
      };
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

// Main authentication function with automatic hybrid fallback
export async function robustAndroidGoogleAuth() {
  console.log('🎯 === HYBRID GOOGLE AUTHENTICATION START ===');
  console.log('📱 Strategy: Credential Manager → Web Fallback → Error');
  
  if (!Capacitor.isNativePlatform()) {
    console.log('🌐 Web platform detected, using web authentication');
    return await webGoogleSignInForAndroid();
  }
  
  // === PHASE 1: Try Native Credential Manager ===
  console.log('📱 Phase 1: Attempting Credential Manager authentication...');
  const nativeResult = await enhancedNativeGoogleSignIn();
  
  if (nativeResult.user) {
    console.log('✅ SUCCESS: Credential Manager authentication completed');
    return nativeResult;
  }
  
  // === PHASE 2: Automatic Web Fallback ===
  if (nativeResult.error === 'CREDENTIAL_MANAGER_NOT_SUPPORTED' || 
      (nativeResult as any).shouldFallbackToWeb) {
    console.log('🔄 Phase 2: Credential Manager unavailable, switching to web method...');
    
    const webResult = await webGoogleSignInForAndroid();
    
    if (webResult.user) {
      console.log('✅ SUCCESS: Web authentication completed (fallback)');
      return webResult;
    }
    
    console.error('❌ FAILURE: Both methods failed');
    return {
      user: null,
      error: 'Unable to complete sign-in. Please check your internet connection and try again.'
    };
  }
  
  // === PHASE 3: Try web fallback for any other error ===
  console.log('🔄 Phase 3: Native auth failed with error, trying web fallback...');
  const webResult = await webGoogleSignInForAndroid();
  
  if (webResult.user) {
    console.log('✅ SUCCESS: Web authentication completed (emergency fallback)');
    return webResult;
  }
  
  // === All methods exhausted ===
  console.error('❌ FAILURE: All authentication methods failed');
  console.error('Native error:', nativeResult.error);
  console.error('Web error:', webResult.error);
  
  return {
    user: null,
    error: 'Sign-in failed. Please try again or use phone authentication.'
  };
}