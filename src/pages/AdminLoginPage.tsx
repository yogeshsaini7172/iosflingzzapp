import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminLoginPageProps {
  onSuccess: () => void;
}

const AdminLoginPage = ({ onSuccess }: AdminLoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Query admin_credentials table
      // Using type assertion because admin_credentials is not in generated types yet
      // After running the migration, you can regenerate types with: npx supabase gen types typescript
      const { data, error: queryError } = await (supabase as any)
        .from('admin_credentials')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (queryError) {
        console.error('Database query error:', queryError);
        setError('Authentication error. Please try again.');
        setIsLoading(false);
        return;
      }

      if (!data) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // For now, simple password comparison (TODO: implement bcrypt in production)
      // In production, you should use bcrypt.compare(password, data.password_hash)
      if (password === (data as any).password_hash) {
        // Valid credentials - create session
        const adminSession = {
          email: (data as any).email,
          authenticated: true,
          timestamp: Date.now(),
          expiresIn: 24 * 60 * 60 * 1000 // 24 hours
        };
        
        localStorage.setItem('admin_session', JSON.stringify(adminSession));
        sessionStorage.setItem('admin_authenticated', 'true');
        
        // Success
        onSuccess();
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600 p-4 rounded-full">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-purple-200">Community Management Dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your admin credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Sign In to Dashboard
                  </>
                )}
              </Button>
            </form>

            {/* Footer Note */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>🔒 Secure admin access only</p>
              <p className="mt-1 text-xs">
                Contact system administrator if you need access
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-purple-200/60">
          <p>This is a protected area. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;

