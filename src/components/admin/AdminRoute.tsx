import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * AdminRoute - Protected route for admin features
 * 
 * ⚠️ TEMPORARY: Currently allows all authenticated users
 * TODO: Restore role-based access when admin system is implemented
 * See: TEMP_COMMUNITY_ACCESS.md for details
 */

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TEMPORARY: Just check if user is authenticated
    // TODO: Restore checkAdminStatus() when admin system is ready
    if (user?.uid) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  /* ============================================================
   * ORIGINAL ADMIN CHECK - COMMENTED FOR FUTURE RESTORATION
   * ============================================================
   * 
   * Uncomment this when implementing proper role-based admin system:
   * 
   * const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
   * 
   * const checkAdminStatus = async () => {
   *   if (!user?.uid) {
   *     setIsAdmin(false);
   *     setLoading(false);
   *     return;
   *   }
   * 
   *   try {
   *     // TODO: Update this to check 'role' column instead of 'is_admin'
   *     // Example: SELECT role FROM profiles WHERE firebase_uid = user.uid
   *     // Then check: role === 'super_admin' || role === 'community_admin'
   *     
   *     const { data, error } = await supabase
   *       .from('profiles')
   *       .select('role, is_admin')  // Add role column when available
   *       .eq('firebase_uid', user.uid)
   *       .maybeSingle();
   * 
   *     if (error) {
   *       console.error('Error checking admin status:', error);
   *       setIsAdmin(false);
   *     } else if (!data) {
   *       console.log('No profile found for user:', user.uid);
   *       setIsAdmin(false);
   *     } else {
   *       // Future: Check if role is 'super_admin' or 'community_admin'
   *       // const hasAdminRole = ['super_admin', 'community_admin'].includes(data.role);
   *       const isAdminUser = data?.is_admin === true;
   *       console.log('Admin status for user:', user.uid, '-> is_admin:', isAdminUser);
   *       setIsAdmin(isAdminUser);
   *     }
   *   } catch (error) {
   *     console.error('Caught error checking admin status:', error);
   *     setIsAdmin(false);
   *   } finally {
   *     setLoading(false);
   *   }
   * };
   * 
   * ============================================================ */

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // TEMPORARY: All authenticated users have access
  // TODO: Restore admin check when role system is implemented
  // Original code: if (!isAdmin) { redirect to /community with error }
  
  // User is authenticated - render the protected component
  return <>{children}</>;
};

export default AdminRoute;

