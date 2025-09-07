import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, googleProvider, createRecaptchaVerifier } from '@/integrations/firebase/config';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser?.email);
      setUser(firebaseUser);
      setIsLoading(false);

      // Sync with Supabase when user signs in
      if (firebaseUser) {
        // Create or update profile in Supabase
        await syncUserProfile(firebaseUser);
        toast.success('Successfully signed in!');
      } else {
        toast.success('Successfully signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  const syncUserProfile = async (firebaseUser: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', firebaseUser.uid)
        .maybeSingle();

      if (!existingProfile) {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: firebaseUser.uid,
            first_name: firebaseUser.displayName?.split(' ')[0] || '',
            last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            email: firebaseUser.email || '',
            date_of_birth: new Date().toISOString().split('T')[0],
            gender: 'prefer_not_to_say',
            university: '',
            verification_status: 'pending',
            is_active: true,
            last_active: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating profile:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
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

      // Create reCAPTCHA verifier with better configuration for Indian users
      const recaptchaVerifier = createRecaptchaVerifier('recaptcha-container');
      
      // Add error handling for reCAPTCHA failures
      recaptchaVerifier.verify().catch((error) => {
        console.error('reCAPTCHA verification failed:', error);
        toast.error('Verification failed. Please try again.');
      });

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmationResult);
      toast.success('OTP sent to your phone!');
      return { confirmationResult };
    } catch (error: any) {
      console.error('Phone sign-in error:', error);
      
      // Provide more specific error messages
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