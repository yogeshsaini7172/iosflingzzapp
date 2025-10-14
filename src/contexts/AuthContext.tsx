import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import {
  login,
  signup,
  googleLogin,
  phoneLogin,
  verifyOTP,
  signOut as authSignOut
} from '../services/auth';
import { toast } from 'sonner';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  getIdToken: () => Promise<string | null>;
  signInWithPhone: (phone: string) => Promise<{ error?: any; confirmationResult?: any }>;
  verifyPhoneOTP: (confirmationResult: any, otp: string) => Promise<{ user?: User; error?: any }>;
  signInWithGoogle: () => Promise<{ user?: User; error?: any }>;
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

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  const prevUserRef = useRef<User | null>(null);

  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      } : 'null');

      const wasAuthenticated = !!prevUserRef.current;
      setUser(firebaseUser);
      prevUserRef.current = firebaseUser;

      if (firebaseUser) {
        console.log('🔑 Firebase user authenticated');
        // Only show success message for new logins, not page refreshes
        if (!wasAuthenticated && initialAuthCheck) {
          toast.success('Successfully signed in!');
        }
      } else {
        console.log('🔥 No user found - user signed out or no session');
        if (wasAuthenticated) {
          console.log('👋 User logged out, clearing state');
          toast.success('Successfully signed out');
        }
      }

      // Mark initial auth check as complete
      if (!initialAuthCheck) {
        setInitialAuthCheck(true);
      }

      setIsLoading(false);
    });

    return () => {
      console.log('🔥 Firebase Auth: Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (!user) {
      console.log('🔑 No user available for token');
      return null;
    }

    try {
      const token = await user.getIdToken(true); // Force refresh
      console.log('🔑 ID token obtained successfully');
      return token;
    } catch (error) {
      console.error('🔑 Failed to get ID token:', error);
      return null;
    }
  };

  const signInWithPhone = async (phone: string) => {
    console.log('📱 Attempting phone sign-in for:', phone);

    try {
      setIsLoading(true);

      // Format phone number for Firebase (add +91 if not present)
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        const digits = formattedPhone.replace(/\D/g, '');
        if (digits.length === 10) {
          formattedPhone = `+91${digits}`;
        } else if (digits.length === 12 && digits.startsWith('91')) {
          formattedPhone = `+${digits}`;
        } else {
          formattedPhone = `+91${digits}`;
        }
      }

      console.log('📱 Formatted phone:', formattedPhone);

      const result = await phoneLogin(formattedPhone);

      if (result.error) {
        toast.error(result.error);
        return { confirmationResult: null, error: result.error };
      }

      console.log('📱 SMS sent successfully');
      toast.success('Verification code sent to your phone');

      return { confirmationResult: result.confirmationResult, error: null };
    } catch (error: any) {
      console.error('📱 Phone sign-in error:', error);
      toast.error('Failed to send verification code');
      return { confirmationResult: null, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhoneOTP = async (confirmationResult: any, otp: string) => {
    console.log('🔐 Verifying OTP...');

    try {
      setIsLoading(true);
      const result = await verifyOTP(confirmationResult, otp);

      if (result.error) {
        toast.error(result.error);
        return { user: null, error: result.error };
      }

      console.log('🔐 OTP verified successfully:', result.user?.uid);
      toast.success('Phone number verified successfully!');
      return { user: result.user, error: null };
    } catch (error: any) {
      console.error('🔐 OTP verification error:', error);
      toast.error('Invalid verification code');
      return { user: null, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    console.log('🔍 Attempting Google sign-in with timing protection...');

    try {
      setIsLoading(true);

      // Add initial delay to ensure all systems are ready
      console.log('⏳ Ensuring all systems are ready...');
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = await googleLogin();

      if (result.error) {
        // Don't show error if it's a redirect in progress
        if (result.error === 'redirecting') {
          console.log('🔄 Redirecting for Google authentication...');
          toast.info('Redirecting to Google sign-in...');
          return { user: null, error: null }; // Don't treat redirect as error
        }

        toast.error(result.error);
        return { user: null, error: result.error };
      }

      console.log('🔍 Google sign-in successful:', result.user?.uid);
      toast.success('Successfully signed in with Google!');
      return { user: result.user, error: null };

    } catch (error: any) {
      console.error('🔍 Google sign-in error:', error);
      toast.error('Google sign-in failed');
      return { user: null, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    try {
      const result = await authSignOut();
      if (result.error) {
        toast.error('Failed to sign out');
        return { error: result.error };
      } else {
        console.log('🚪 Sign out successful');
        // Clear landing page state so it shows again on next visit
        localStorage.removeItem('landing_dismissed');
        toast.success('Signed out successfully');
        return { error: null };
      }
    } catch (error) {
      console.error('🚪 Sign out error:', error);
      toast.error('Failed to sign out');
      return { error: error };
    }
  };

  const isAuthenticated = !!user;
  const userId = user?.uid || null;

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
};
