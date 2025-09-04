import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Email/Password
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      setUser(firebaseUser);
      setIsLoading(false);

      if (firebaseUser) {
        toast.success('Successfully signed in!');
      }
    });

    return () => unsubscribe();
  }, []);


  // Email/Password signup
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
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


  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Update display name if available
      if (result.user.displayName && !result.user.displayName.includes(result.user.email || '')) {
        await updateProfile(result.user, {
          displayName: result.user.displayName
        });
      }
      
      return {};
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message || 'An unexpected error occurred');
      return { error };
    }
  };


  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Successfully signed out');
      
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