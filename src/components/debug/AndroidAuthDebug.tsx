import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { diagnoseAndroidAuth, enhancedNativeGoogleSignIn } from '../../services/enhancedAndroidAuth';
import { auth } from '../../firebase';

interface DiagnosticResult {
  success: boolean;
  error?: string;
  diagnostics?: any;
}

interface AuthTestResult {
  success: boolean;
  user?: any;
  error?: string;
  details?: any;
}

export default function AndroidAuthDebug() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [authTest, setAuthTest] = useState<AuthTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog('🔍 Starting Android authentication diagnostics...');
      const result = await diagnoseAndroidAuth();
      setDiagnostics(result);
      
      if (result.success) {
        addLog('✅ Diagnostics passed');
      } else {
        addLog(`❌ Diagnostics failed: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Diagnostics error: ${error.message}`);
      setDiagnostics({
        success: false,
        error: error.message
      });
    }
    
    setIsLoading(false);
  };

  const testGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      addLog('🚀 Testing enhanced Google authentication...');
      const result = await enhancedNativeGoogleSignIn();
      
      setAuthTest({
        success: !!result.user,
        user: result.user,
        error: result.error,
        details: {
          platform: Capacitor.getPlatform(),
          isNative: Capacitor.isNativePlatform(),
          timestamp: new Date().toISOString()
        }
      });
      
      if (result.user) {
        addLog(`✅ Authentication successful: ${result.user.email}`);
      } else {
        addLog(`❌ Authentication failed: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Authentication error: ${error.message}`);
      setAuthTest({
        success: false,
        error: error.message
      });
    }
    
    setIsLoading(false);
  };

  const clearLogs = () => {
    setLogs([]);
    setDiagnostics(null);
    setAuthTest(null);
  };

  const checkFirebaseConfig = () => {
    addLog('🔧 Checking Firebase configuration...');
    addLog(`Project ID: ${auth.app.options.projectId}`);
    addLog(`App ID: ${auth.app.options.appId}`);
    addLog(`Auth Domain: ${auth.app.options.authDomain}`);
    addLog(`API Key: ${auth.app.options.apiKey ? '✅ Present' : '❌ Missing'}`);
  };

  useEffect(() => {
    checkFirebaseConfig();
  }, []);

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 Android Authentication Debug
            <Badge variant={Capacitor.getPlatform() === 'android' ? 'default' : 'secondary'}>
              {Capacitor.getPlatform()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Comprehensive debugging tool for Android Google Sign-In issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={runDiagnostics} disabled={isLoading} variant="outline">
              🔍 Run Diagnostics
            </Button>
            <Button onClick={testGoogleAuth} disabled={isLoading}>
              🚀 Test Google Auth
            </Button>
            <Button onClick={clearLogs} variant="ghost">
              🧹 Clear Logs
            </Button>
          </div>

          {diagnostics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Diagnostics Result {diagnostics.success ? '✅' : '❌'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {diagnostics.success ? (
                  <div className="text-green-600">All checks passed</div>
                ) : (
                  <div className="text-red-600">{diagnostics.error}</div>
                )}
                {diagnostics.diagnostics && (
                  <div className="mt-2 text-xs">
                    <pre>{JSON.stringify(diagnostics.diagnostics, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {authTest && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Authentication Test {authTest.success ? '✅' : '❌'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {authTest.success ? (
                  <div className="space-y-2">
                    <div className="text-green-600">Authentication successful!</div>
                    <div className="text-xs">User: {authTest.user?.email}</div>
                    <div className="text-xs">UID: {authTest.user?.uid}</div>
                  </div>
                ) : (
                  <div className="text-red-600">{authTest.error}</div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Debug Logs</h4>
            <ScrollArea className="h-40 w-full border rounded p-2">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-sm">No logs yet...</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">🎯 Common Solutions:</h4>
              <ul className="text-sm space-y-1">
                <li>• Ensure Google Play Services is installed and updated</li>
                <li>• Verify SHA-1 fingerprint matches in Firebase Console</li>
                <li>• Check that Google Sign-In is enabled in Firebase Console</li>
                <li>• Try on a physical device instead of emulator</li>
                <li>• Rebuild the app after configuration changes</li>
                <li>• Check Android Studio Logcat for detailed errors</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}