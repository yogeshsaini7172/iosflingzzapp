import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, googleProvider, createRecaptchaVerifier } from '@/integrations/firebase/config';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null; // Firebase UID
  supabaseUserId: string | null; // Supabase Auth user id (UUID)
  accessToken: string | null;
  // Phone OTP
  signInWithPhone: (phone: string) => Promise<{ error?: any; confirmationResult?: ConfirmationResult }>;
  verifyPhoneOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<{ error?: any }>;
  // OAuth
  signInWithGoogle: () => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  // Supabase session management
  getSupabaseSession: () => Promise<any>;
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
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // Get current Supabase session
  const getSupabaseSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting Supabase session:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener...');
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? { 
        uid: firebaseUser.uid, 
        email: firebaseUser.email,
        displayName: firebaseUser.displayName 
      } : 'null');
      console.log('🔥 Setting user state to:', firebaseUser ? 'USER_OBJECT' : 'NULL');
      setUser(firebaseUser);
      
      // Get access token for Supabase requests and sync Supabase session
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setAccessToken(token);
          console.log('🔑 Firebase token acquired for Supabase requests');

          // Sign into Supabase using Firebase ID token
          const { data: sbSession, error: sbError } = await supabase.auth.signInWithIdToken({
            provider: 'firebase',
            token,
          });
          if (sbError) {
            console.error('❌ Supabase signInWithIdToken failed:', sbError);
            setSupabaseUserId(null);
          } else {
            const sbUid = sbSession?.user?.id ?? sbSession?.session?.user?.id ?? null;
            setSupabaseUserId(sbUid);
            console.log('✅ Supabase session established:', !!sbSession?.session, '| uid:', sbUid);
          }

          // Any profile sync/creation is handled later in profile flow
          await syncUserProfile(firebaseUser);
          toast.success('Successfully signed in!');
        } catch (error) {
          console.error('❌ Error getting Firebase token or syncing Supabase:', error);
          setAccessToken(null);
          setSupabaseUserId(null);
        }
      } else {
        setAccessToken(null);
        setSupabaseUserId(null);
        // Ensure Supabase session is cleared when Firebase signs out
        try { await supabase.auth.signOut(); } catch (e) { /* no-op */ }
        console.log('🔥 No user found - user signed out or no session');
        if (firebaseUser === null) {
          toast.success('Successfully signed out');
        }
      }
      
      setIsLoading(false);
    });

    // Check current auth state immediately
    console.log('🔥 Current auth state on mount:', auth.currentUser);

    return () => unsubscribe();
  }, []);

  const syncUserProfile = async (firebaseUser: User) => {
    try {
      // Profile creation is now handled by the profile-completion edge function
      // This prevents RLS violations since edge functions use service role
      console.log('User profile will be created during profile completion flow');
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
      const result = await signInWithPopup(auth, googleProvider);

      // Obtain Google ID token from Firebase credential and establish Supabase session
      // Note: credential may be null in some browsers; guard accordingly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const credential: any = (await import('firebase/auth')).GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken as string | undefined;

      if (idToken) {
        const { data: sbSession, error: sbError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (sbError) {
          console.error('❌ Supabase signInWithIdToken (google) failed:', sbError);
          setSupabaseUserId(null);
        } else {
          const sbUid = sbSession?.user?.id ?? sbSession?.session?.user?.id ?? null;
          setSupabaseUserId(sbUid);
          console.log('✅ Supabase session established via Google:', sbUid);
        }
      } else {
        console.warn('⚠️ Google credential missing idToken; Supabase session may not be created.');
      }

      return {};
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Sign out from both Firebase and Supabase
      await Promise.allSettled([
        firebaseSignOut(auth),
        supabase.auth.signOut()
      ]);
      setSupabaseUserId(null);
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
    userId: user?.uid || null,
    supabaseUserId,
    accessToken,
    signInWithPhone,
    verifyPhoneOTP,
    signInWithGoogle,
    signOut,
    getSupabaseSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};