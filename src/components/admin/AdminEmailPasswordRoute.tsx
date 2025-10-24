import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminLoginPage from '@/pages/AdminLoginPage';

interface AdminEmailPasswordRouteProps {
  children: React.ReactNode;
}

/**
 * AdminEmailPasswordRoute - Route guard for admin1712 portal
 * 
 * Checks if user has valid admin session:
 * - If authenticated -> Show protected content (CommunityDashboard)
 * - If not authenticated -> Show AdminLoginPage
 * - Validates session expiry (24 hours)
 */
const AdminEmailPasswordRoute = ({ children }: AdminEmailPasswordRouteProps) => {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateAdminSession();
  }, []);

  const validateAdminSession = () => {
    try {
      // Check localStorage for admin session
      const sessionData = localStorage.getItem('admin_session');
      const sessionAuth = sessionStorage.getItem('admin_authenticated');
      
      if (!sessionData || !sessionAuth) {
        console.log('❌ No admin session found');
        setIsAdminAuth(false);
        setLoading(false);
        return;
      }

      // Parse and validate session
      const session = JSON.parse(sessionData);
      const now = Date.now();
      const elapsed = now - session.timestamp;

      // Check if session expired (24 hours)
      if (elapsed > session.expiresIn) {
        console.log('❌ Admin session expired');
        localStorage.removeItem('admin_session');
        sessionStorage.removeItem('admin_authenticated');
        setIsAdminAuth(false);
        setLoading(false);
        return;
      }

      // Valid session
      console.log('✅ Valid admin session found for:', session.email);
      setIsAdminAuth(true);
      setLoading(false);
    } catch (error) {
      console.error('Error validating admin session:', error);
      setIsAdminAuth(false);
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    console.log('✅ Admin login successful');
    setIsAdminAuth(true);
  };

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200 text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login page
  if (!isAdminAuth) {
    return <AdminLoginPage onSuccess={handleLoginSuccess} />;
  }

  // Authenticated - render protected content
  return <>{children}</>;
};

export default AdminEmailPasswordRoute;

