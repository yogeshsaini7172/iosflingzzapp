import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  // Email OTP (kept for backward-compat)
  signUpWithEmail: (email: string) => Promise<{ error?: any }>;
  verifyOTP: (email: string, otp: string) => Promise<{ error?: any }>;
  resendOTP: (email: string) => Promise<{ error?: any }>;
  // Phone OTP
  signInWithPhone: (phone: string) => Promise<{ error?: any }>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle successful sign in
        if (event === 'SIGNED_IN' && session?.user) {
          toast.success('Successfully signed in!');
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUpWithEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          // Remove emailRedirectTo to force OTP codes instead of magic links
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message);
        return { error };
      }

      toast.success('Check your email for the 6-digit OTP code!');
      return {};
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        console.error('OTP verification error:', error);
        toast.error(error.message);
        return { error };
      }

      if (data.user) {
        toast.success('Email verified successfully!');
        return {};
      }

      return { error: { message: 'Verification failed' } };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth?verified=true`,
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        toast.error(error.message);
        return { error };
      }

      return {};
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error('Resend OTP error:', error);
        toast.error(error.message);
        return { error };
      }

      toast.success('OTP code resent! Check your email.');
      return {};
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  // Phone-based OTP
  const signInWithPhone = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true },
      });
      if (error) {
        console.error('Phone sign-in error:', error);
        toast.error(error.message);
        return { error };
      }
      toast.success('OTP sent via SMS!');
      return {};
    } catch (error: any) {
      console.error('Phone sign-in error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const verifyPhoneOTP = async (phone: string, otp: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });
      if (error) {
        console.error('SMS verification error:', error);
        toast.error(error.message);
        return { error };
      }
      if (data.user) {
        toast.success('Phone verified successfully!');
        return {};
      }
      return { error: { message: 'Verification failed' } };
    } catch (error: any) {
      console.error('SMS verification error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const resendPhoneOTP = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true } });
      if (error) {
        console.error('Resend SMS OTP error:', error);
        toast.error(error.message);
        return { error };
      }
      toast.success('OTP resent via SMS!');
      return {};
    } catch (error: any) {
      console.error('Resend SMS OTP error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        toast.error(error.message);
        return { error };
      }

      return {};
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    // email OTP (legacy)
    signUpWithEmail,
    verifyOTP,
    resendOTP,
    // phone OTP (primary)
    signInWithPhone,
    verifyPhoneOTP,
    resendPhoneOTP,
    // oauth
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};