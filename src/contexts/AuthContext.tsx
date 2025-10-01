import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier, signOut as firebaseSignOut, signInWithPopup, GoogleAuthProvider, ConfirmationResult } from 'firebase/auth';
import { auth, googleProvider, createRecaptchaVerifier } from '@/integrations/firebase/config';
import { isMobileEnvironment, handleMobileAuthError } from '@/utils/mobileAuthHelper';
import { preventRedirectAuth, handleMobileAuthError as handleMobileError, detectMobileEnvironment } from '@/utils/mobileAuthFix';
import { toast } from 'sonner';
import { getCurrentLocation } from '@/utils/locationUtils';
import { updateUserLocation } from '@/services/profile';

type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  locationEnabled: boolean;
  currentLocation: any | null;
  getIdToken: () => Promise<string | null>;
  signInWithPhone: (phone: string) => Promise<{ error?: any; confirmationResult?: ConfirmationResult }>;
  verifyPhoneOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<{ error?: any }>;
  signInWithGoogle: () => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔐 AuthProvider initializing...');
  console.log('🔍 Environment:', {
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    isWebView: typeof window !== 'undefined' && window.navigator.userAgent.includes('wv'),
    isMobile: typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent),
    hasSessionStorage: typeof sessionStorage !== 'undefined',
    hasLocalStorage: typeof localStorage !== 'undefined'
  });
  
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any | null>(null);

  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? { 
        uid: firebaseUser.uid, 
        email: firebaseUser.email,
        displayName: firebaseUser.displayName 
      } : 'null');
      
      const wasAuthenticated = !!user;
      setUser(firebaseUser);
      
      if (firebaseUser) {
        console.log('🔑 Firebase user authenticated');
        // Only show success message for new logins, not page refreshes
        if (!wasAuthenticated && initialAuthCheck) {
          toast.success('Successfully signed in!');
        }

        // Check location on new login
        if (!wasAuthenticated) {
          const checkLocation = async () => {
            try {
              const loc = await getCurrentLocation();
              setCurrentLocation(loc);
              setLocationEnabled(true);
              // Update user location in database
              const locationData = {
                city: '', // Could reverse geocode, but for now empty
                region: '',
                country: '',
                latitude: loc.latitude,
                longitude: loc.longitude
              };
              await updateUserLocation(locationData);
            } catch (error) {
              console.error('Location not enabled:', error);
              toast.error('Location access is required to use this app. Please enable location services and try again.');
              await firebaseSignOut(auth);
              setUser(null);
              setLocationEnabled(false);
              setCurrentLocation(null);
            }
          };
          checkLocation();
        }
      } else {
        console.log('🔥 No user found - user signed out or no session');
        if (wasAuthenticated) {
          console.log('👋 User logged out, clearing state');
          toast.success('Successfully signed out');
        }
        setLocationEnabled(false);
        setCurrentLocation(null);
      }
      
      // Mark initial auth check as complete
      if (!initialAuthCheck) {
        setInitialAuthCheck(true);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, initialAuthCheck]);

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    try {
      // Force refresh to get valid token and check signature
      const token = await auth.currentUser.getIdToken(true);
      console.log('✅ Fresh Firebase token obtained');
      return token;
    } catch (error) {
      console.error('❌ Error getting Firebase token:', error);
      // If token is invalid, sign out user
      await firebaseSignOut(auth);
      setUser(null);
      toast.error('Session expired. Please sign in again.');
      return null;
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      // Format phone number for India
      let formattedPhone = phone.trim();
      if (formattedPhone.startsWith('91') && !formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      } else if (formattedPhone.startsWith('0')) {
        formattedPhone = '+91' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+91') && formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      }

      console.log('Attempting phone auth with:', formattedPhone);

      // Clear any existing reCAPTCHA first
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }

      // Wait a bit for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create reCAPTCHA verifier
      const recaptchaVerifier = createRecaptchaVerifier('recaptcha-container');
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      toast.success('OTP sent to your phone!');
      return { confirmationResult };
    } catch (error: any) {
      console.error('Phone sign-in error:', error);
      
      if (error.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number. Please include country code (+91 for India)');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/captcha-check-failed') {
        toast.error('Verification failed. Please refresh and try again.');
      } else {
        toast.error(error.message || 'Failed to send OTP. Please try again.');
      }
      
      return { error };
    }
  };

  const verifyPhoneOTP = async (confirmationResult: ConfirmationResult, otp: string) => {
    try {
      await confirmationResult.confirm(otp);
      toast.success('Phone verified successfully!');
      return {};
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔑 Starting Google sign-in...');
      const environment = detectMobileEnvironment();
      console.log('📱 Environment check:', environment);
      
      // Check if we're in an environment where Google auth won't work
      if (environment && (!environment.sessionStorageAccessible || environment.isWebView || environment.isCapacitor)) {
        console.log('🚫 Google auth unavailable in this environment');
        toast.error('Google sign-in is not supported in this mobile app. Please use phone number authentication.', {
          duration: 8000,
        });
        return { error: new Error('Google auth not supported in mobile environment') };
      }
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      if (isMobileEnvironment() || preventRedirectAuth()) {
        console.log('📱 Mobile environment detected - using popup-only auth (no redirect fallback)');
        
        try {
          console.log('🚀 Attempting Firebase signInWithPopup in mobile...');
          await signInWithPopup(auth, provider);
          console.log('✅ Mobile popup sign-in successful');
          toast.success('Successfully signed in with Google!');
          return {};
        } catch (popupError: any) {
          console.log('❌ Mobile popup failed:', popupError.code, popupError.message);
          
          // Use the enhanced mobile error handler
          const isMobileAuthIssue = handleMobileError(popupError);
          if (isMobileAuthIssue) {
            throw popupError; // Let the outer error handler deal with it
          }
          
          // For other popup errors, don't try redirect - just recommend phone auth
          console.log('🚫 Popup failed - recommending phone auth');
          toast.error('Google sign-in is not available in this mobile environment. Please use phone authentication.', {
            duration: 8000
          });
          throw new Error('Mobile popup auth failed - use phone auth');
        }
      } else {
        console.log('🖥️ Desktop environment - using standard popup auth');
        console.log('🚀 Attempting Firebase signInWithPopup...');
        await signInWithPopup(auth, provider);
        console.log('✅ Desktop Google sign-in successful');
        toast.success('Successfully signed in with Google!');
        return {};
      }
    } catch (error: any) {
      console.error('❌ Google sign in error:', error);
      
      // Check if this is a known mobile auth issue and provide helpful messaging
      const isMobileAuthIssue = handleMobileError(error);
      if (isMobileAuthIssue) {
        return { error };
      }
      
      // Handle other errors with appropriate messages
      if (error.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups or try phone authentication.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        toast.error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(error.message || 'Google sign-in failed. Please try phone authentication instead.');
      }
      
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will handle setting user to null
      console.log('✅ Sign out successful');
      return {};
    } catch (error: unknown) {
      console.error('Sign out error:', error);
      toast.error(error instanceof Error ? error.message : 'Sign out failed');
      return { error };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    userId: user?.uid || null,
    locationEnabled,
    currentLocation,
    getIdToken,
    signInWithPhone,
    verifyPhoneOTP,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
