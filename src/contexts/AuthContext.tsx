import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle auth events
        if (event === 'SIGNED_IN' && session?.user) {
          toast.success('Successfully signed in!');
          
          // Auto-create profile if it doesn't exist
          setTimeout(async () => {
            await ensureUserProfile(session.user);
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out');
          // Clear any cached data
          localStorage.removeItem('demoUserId');
          localStorage.removeItem('demoProfile');
        }
      }
    );

    // Then check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Ensure profile exists for existing session
        if (session?.user) {
          setTimeout(async () => {
            await ensureUserProfile(session.user);
          }, 0);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Ensure user profile exists
  const ensureUserProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Create profile from user metadata or defaults
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
            last_name: user.user_metadata?.last_name || '',
            email: user.email || '',
            date_of_birth: new Date().toISOString().split('T')[0], // Default to today
            gender: 'prefer_not_to_say',
            university: user.user_metadata?.university || '',
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message);
        return { error };
      }

      if (data.user && !data.session) {
        toast.success('Please check your email to confirm your account!');
      } else if (data.session) {
        toast.success('Account created successfully!');
      }
      
      return {};
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  // Email/Password signin
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        toast.error(error.message);
        return { error };
      }

      return {};
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  // Email OTP signup
  const signUpWithEmailOTP = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        console.error('OTP signup error:', error);
        toast.error(error.message);
        return { error };
      }

      toast.success('Check your email for the 6-digit OTP code!');
      return {};
    } catch (error: any) {
      console.error('OTP signup error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const verifyEmailOTP = async (email: string, otp: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
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
          redirectTo: `${window.location.origin}/`
        }
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

  const resendEmailOTP = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
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

  // Phone OTP signup
  const signUpWithPhoneOTP = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true }
      });
      
      if (error) {
        console.error('Phone signup error:', error);
        toast.error(error.message);
        return { error };
      }
      
      toast.success('OTP sent via SMS!');
      return {};
    } catch (error: any) {
      console.error('Phone signup error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const verifyPhoneOTP = async (phone: string, otp: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
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
      const { error } = await supabase.auth.signInWithOtp({ 
        phone, 
        options: { shouldCreateUser: true } 
      });
      
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
    session,
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