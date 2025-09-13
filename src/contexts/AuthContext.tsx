import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, ConfirmationResult } from 'firebase/auth';
import { auth, googleProvider, createRecaptchaVerifier } from '@/integrations/firebase/config';
import { toast } from 'sonner';

type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
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
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        if (!wasAuthenticated) {
          toast.success('Successfully signed in!');
        }
      } else {
        console.log('🔥 No user found - user signed out or no session');
        if (wasAuthenticated) {
          console.log('👋 User logged out, clearing state');
          toast.success('Successfully signed out');
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return {};
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message);
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
      toast.error(error.message);
      return { error };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    userId: user?.uid || null,
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