import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, googleProvider, createRecaptchaVerifier } from '@/integrations/firebase/config';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null; // Firebase UID only
  accessToken: string | null;
  // Phone OTP
  signInWithPhone: (phone: string) => Promise<{ error?: any; confirmationResult?: ConfirmationResult }>;
  verifyPhoneOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<{ error?: any }>;
  // OAuth
  signInWithGoogle: () => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  console.log('🔐 AuthProvider initializing...');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener...');
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? { 
        uid: firebaseUser.uid, 
        email: firebaseUser.email,
        displayName: firebaseUser.displayName 
      } : 'null');
      
      setUser(firebaseUser);
      
      // Get access token for API requests
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setAccessToken(token);
          console.log('🔑 Firebase token acquired');
          toast.success('Successfully signed in!');
        } catch (error) {
          console.error('❌ Error getting Firebase token:', error);
          setAccessToken(null);
        }
      } else {
        setAccessToken(null);
        console.log('🔥 No user found - user signed out or no session');
        if (firebaseUser === null) {
          toast.success('Successfully signed out');
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      setConfirmationResult(confirmationResult);
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
      await signInWithPopup(auth, googleProvider);
      return {};
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return {};
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message);
      return { error };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    userId: user?.uid || null, // Firebase UID only
    accessToken,
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