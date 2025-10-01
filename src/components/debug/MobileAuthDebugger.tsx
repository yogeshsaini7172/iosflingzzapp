import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { isNativeAuthAvailable, detectMobileEnvironment, cleanupMobileAuthState } from '../../services/mobileAuth';
import { googleLogin } from '../../services/auth';
import { toast } from 'sonner';

export function MobileAuthDebugger() {
  const [environment, setEnvironment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEnvironment(detectMobileEnvironment());
  }, []);

  const testGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const result = await googleLogin();
      if (result.user) {
        toast.success('Google Auth test successful!');
        console.log('✅ Auth test result:', result.user);
      } else if (result.error) {
        toast.error('Google Auth test failed: ' + result.error);
      }
    } catch (error) {
      toast.error('Google Auth test error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    await cleanupMobileAuthState();
    toast.success('Mobile auth state cleaned up');
  };

  const refreshEnvironment = () => {
    setEnvironment(detectMobileEnvironment());
    toast.success('Environment info refreshed');
  };

  if (!environment) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Mobile Auth Debugger</CardTitle>
        <CardDescription>
          Debug mobile authentication environment and test auth flows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Info */}
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Environment Detection:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Platform: <strong>{environment.platform}</strong></div>
            <div>Native: <strong>{environment.isNative ? '✅' : '❌'}</strong></div>
            <div>Capacitor: <strong>{environment.isCapacitor ? '✅' : '❌'}</strong></div>
            <div>Google Auth: <strong>{environment.supports.GoogleAuth ? '✅' : '❌'}</strong></div>
            <div>Storage: <strong>{environment.supports.storage ? '✅' : '❌'}</strong></div>
            <div>Notifications: <strong>{environment.supports.notifications ? '✅' : '❌'}</strong></div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-muted-foreground">
              User Agent: {environment.userAgent.substring(0, 60)}...
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={testGoogleAuth} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : 'Test Google Auth'}
          </Button>
          
          <Button 
            onClick={handleCleanup}
            variant="outline"
          >
            Cleanup Auth State
          </Button>
          
          <Button 
            onClick={refreshEnvironment}
            variant="outline"
          >
            Refresh Info
          </Button>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium mb-2">Recommendations:</h4>
          <ul className="text-sm space-y-1">
            {!environment.isNative && (
              <li>• Web environment detected - popup auth should work</li>
            )}
            {environment.isNative && !environment.supports.GoogleAuth && (
              <li className="text-orange-600">• Native platform detected but Google Auth may have issues</li>
            )}
            {environment.isNative && environment.supports.GoogleAuth && (
              <li className="text-green-600">• ✅ Native Google Auth should work perfectly</li>
            )}
            {!environment.supports.storage && (
              <li className="text-red-600">• ⚠️ Storage not available - auth persistence may fail</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}