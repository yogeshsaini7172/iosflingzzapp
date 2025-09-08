import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Hook that enforces authentication and provides user data
 * Redirects to auth page if not authenticated
 */
export const useRequiredAuth = () => {
  const { user, isLoading, isAuthenticated, userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🚫 Authentication required - redirecting to auth page');
      toast.error('Please sign in to continue');
      navigate('/auth');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Return null values while loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return {
      user: null,
      userId: null,
      isLoading,
      isAuthenticated: false,
    };
  }

  if (!userId) {
    throw new Error('User ID is required but not available');
  }

  return {
    user,
    userId,
    isLoading: false,
    isAuthenticated: true,
  };
};

/**
 * Hook for components that can work with or without auth
 * Returns null values if not authenticated
 */
export const useOptionalAuth = () => {
  const { user, isLoading, isAuthenticated, userId } = useAuth();

  return {
    user: isAuthenticated ? user : null,
    userId: isAuthenticated ? userId : null,
    isLoading,
    isAuthenticated,
  };
};