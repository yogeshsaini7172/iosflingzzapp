import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Email/Password
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>;
  // Email OTP
  signUpWithEmailOTP: (email: string) => Promise<{ error?: any }>;
  verifyEmailOTP: (email: string, otp: string) => Promise<{ error?: any }>;
  resendEmailOTP: (email: string) => Promise<{ error?: any }>;
  // Phone OTP
  signUpWithPhoneOTP: (phone: string) => Promise<{ error?: any }>;
  verifyPhoneOTP: (phone: string, otp: string) => Promise<{ error?: any }>;
  resendPhoneOTP: (phone: string) => Promise<{ error?: any }>;
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
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    let mounted = true;

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      console.log('Firebase auth state changed:', firebaseUser?.email);
      
      setUser(firebaseUser);
      setIsLoading(false);

      // Handle auth events
      if (firebaseUser) {
        toast.success('Successfully signed in!');
        
        // Auto-create profile if it doesn't exist
        setTimeout(async () => {
          await ensureUserProfile(firebaseUser);
        }, 0);
      } else {
        toast.success('Successfully signed out');
        // Clear any cached data
        localStorage.removeItem('demoUserId');
        localStorage.removeItem('demoProfile');
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Ensure user profile exists
  const ensureUserProfile = async (firebaseUser: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', firebaseUser.uid)
        .single();

      if (!existingProfile) {
        // Create profile from Firebase user data
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: firebaseUser.uid,
            first_name: firebaseUser.displayName?.split(' ')[0] || firebaseUser.email?.split('@')[0] || 'User',
            last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            email: firebaseUser.email || '',
            date_of_birth: new Date().toISOString().split('T')[0], // Default to today
            gender: 'prefer_not_to_say',
            university: '',
            verification_status: 'pending',
            is_active: true,
            is_profile_public: false,
            show_profile: true
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully');
        }
      }
    } catch (error) {
      console.error('Error ensuring profile:', error);
    }
  };

  // Email/Password signup
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(user);
      toast.success('Account created! Please check your email to verify your account.');
      
      return {};
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'An unexpected error occurred');
      return { error };
    }
  };

  // Email/Password signin
  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'An unexpected error occurred');
      return { error };
    }
  };

  // Email OTP signup - Firebase doesn't support email OTP, fallback to email/password
  const signUpWithEmailOTP = async (email: string) => {
    try {
      // Firebase doesn't support email OTP, so we'll use a placeholder
      toast.info('Email OTP not supported with Firebase. Please use email/password signup.');
      return { error: { message: 'Email OTP not supported' } };
    } catch (error: any) {
      console.error('OTP signup error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const verifyEmailOTP = async (email: string, otp: string) => {
    try {
      // Firebase doesn't support email OTP verification this way
      toast.info('Email OTP verification not supported with Firebase.');
      return { error: { message: 'Email OTP verification not supported' } };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error('An unexpected error occurred');
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
      toast.error(error.message || 'An unexpected error occurred');
      return { error };
    }
  };

  const resendEmailOTP = async (email: string) => {
    try {
      // Firebase doesn't support email OTP resend
      toast.info('Email OTP resend not supported with Firebase.');
      return { error: { message: 'Email OTP resend not supported' } };
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  // Phone OTP signup
  const signUpWithPhoneOTP = async (phone: string) => {
    try {
      // Setup reCAPTCHA verifier if not already done
      if (!recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {
            // reCAPTCHA solved
          }
        });
        setRecaptchaVerifier(verifier);
      }
      
      const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier!);
      setConfirmationResult(confirmationResult);
      
      toast.success('OTP sent via SMS!');
      return {};
    } catch (error: any) {
      console.error('Phone signup error:', error);
      toast.error(error.message || 'An unexpected error occurred');
      return { error };
    }
  };

  const verifyPhoneOTP = async (phone: string, otp: string) => {
    try {
      if (!confirmationResult) {
        toast.error('No phone verification in progress');
        return { error: { message: 'No phone verification in progress' } };
      }
      
      await confirmationResult.confirm(otp);
      toast.success('Phone verified successfully!');
      return {};
    } catch (error: any) {
      console.error('SMS verification error:', error);
      toast.error(error.message || 'An unexpected error occurred');
      return { error };
    }
  };

  const resendPhoneOTP = async (phone: string) => {
    try {
      // Resend by calling signUpWithPhoneOTP again
      return await signUpWithPhoneOTP(phone);
    } catch (error: any) {
      console.error('Resend SMS OTP error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      
      // Clear any local storage
      localStorage.removeItem('demoUserId');
      localStorage.removeItem('demoProfile');

      return {};
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    // Email/Password
    signUpWithEmail,
    signInWithEmail,
    // Email OTP
    signUpWithEmailOTP,
    verifyEmailOTP,
    resendEmailOTP,
    // Phone OTP
    signUpWithPhoneOTP,
    verifyPhoneOTP,
    resendPhoneOTP,
    // OAuth
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};