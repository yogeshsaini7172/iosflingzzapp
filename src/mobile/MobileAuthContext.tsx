import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signOut as firebaseSignOut } from 'firebase/auth';
import { toast } from 'sonner';

type MobileAuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<any>;
  verifyOTP: (confirmationResult: any, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const MobileAuthContext = createContext<MobileAuthContextType | undefined>(undefined);

export const useMobileAuth = () => {
  const context = useContext(MobileAuthContext);
  if (context === undefined) {
    throw new Error('useMobileAuth must be used within a MobileAuthProvider');
  }
  return context;
};

export const MobileAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('📱 Setting up mobile auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('📱 Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    console.log('🔍 Starting Google sign-in for mobile...');
    setIsLoading(true);
    
    try {
      // Check if we're in a native environment
      const { Capacitor } = await import('@capacitor/core');
      
      if (Capacitor.isNativePlatform()) {
        console.log('📱 Using native Google sign-in...');
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
        
        // Sign in with native Google
        const result = await FirebaseAuthentication.signInWithGoogle();
        console.log('📱 Native Google sign-in result:', result);
        
        // Bridge native credential to Firebase
        const idToken = (result as any)?.credential?.idToken;
        const accessToken = (result as any)?.credential?.accessToken;
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken, accessToken);
          const cred = await signInWithCredential(auth, credential);
          console.log('✅ Firebase sign-in via native credential:', cred.user.uid);
          toast.success('Successfully signed in with Google!');
          return;
        } else {
          throw new Error('No credential returned from native Google sign-in. Check your Firebase configuration.');
        }
      } else {
        console.log('🌐 Using web Google sign-in...');
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await signInWithPopup(auth, provider);
        console.log('🌐 Web Google sign-in result:', result.user.uid);
        toast.success('Successfully signed in with Google!');
      }
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('null object reference')) {
        toast.error('Google Sign-In not configured properly. Please check your Firebase configuration and SHA-1 fingerprints.');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your internet connection.');
      } else {
        toast.error('Google sign-in failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    console.log('📱 Starting phone sign-in for:', phoneNumber);
    setIsLoading(true);
    
    try {
      // Clean up any existing reCAPTCHA
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }

      // Create new reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('📱 reCAPTCHA solved');
        }
      });

      // Format phone number
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        const digits = formattedPhone.replace(/\D/g, '');
        if (digits.length === 10) {
          formattedPhone = `+91${digits}`;
        } else if (digits.length === 12 && digits.startsWith('91')) {
          formattedPhone = `+${digits}`;
        }
      }

      console.log('📱 Sending SMS to:', formattedPhone);
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      
      toast.success('Verification code sent to your phone');
      return confirmationResult;
    } catch (error: any) {
      console.error('❌ Phone sign-in error:', error);
      toast.error('Failed to send verification code: ' + error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (confirmationResult: any, otp: string) => {
    console.log('🔐 Verifying OTP...');
    setIsLoading(true);
    
    try {
      const result = await confirmationResult.confirm(otp);
      console.log('🔐 OTP verified successfully:', result.user.uid);
      toast.success('Phone number verified successfully!');
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      toast.error('Invalid verification code');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    try {
      await firebaseSignOut(auth);
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithPhone,
    verifyOTP,
    signOut,
  };

  return (
    <MobileAuthContext.Provider value={value}>
      {children}
    </MobileAuthContext.Provider>
  );
};