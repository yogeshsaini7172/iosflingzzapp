import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../contexts/AuthContext';

export const AndroidCredentialManagerDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [compatibility, setCompatibility] = useState<any>(null);
  const { signInWithGoogle } = useAuth();

  useEffect(() => {
    if (Capacitor.getPlatform() === 'android') {
      runDiagnostics();
    }
  }, []);

  const runDiagnostics = async () => {
    try {
      const { AndroidCredentialManagerFix } = await import('../../services/androidCredentialManagerFix');
      
      // Get device diagnostics
      const deviceDiagnostics = {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        userAgent: navigator.userAgent,
        androidVersion: extractAndroidVersion(navigator.userAgent),
        deviceManufacturer: getDeviceManufacturer(navigator.userAgent),
        isEmulator: isEmulator(navigator.userAgent),
        timestamp: new Date().toLocaleString()
      };

      setDiagnostics(deviceDiagnostics);

      // Check compatibility
      const compatibilityCheck = await AndroidCredentialManagerFix.checkDeviceCompatibility();
      setCompatibility(compatibilityCheck);

    } catch (error: any) {
      console.error('Diagnostic error:', error);
      setDiagnostics({ error: error.message });
    }
  };

  const testCredentialManager = async () => {
    setTestResult('Testing Android Credential Manager...');
    
    try {
      const result = await signInWithGoogle();
      
      if (result.error) {
        if (result.error.includes('No credentials available')) {
          setTestResult('❌ Credential Manager Error: No Google accounts configured for this device');
        } else {
          setTestResult(`❌ Error: ${result.error}`);
        }
      } else {
        setTestResult('✅ Success! Android Credential Manager worked.');
      }
    } catch (error: any) {
      setTestResult(`❌ Test failed: ${error.message}`);
    }
  };

  const extractAndroidVersion = (userAgent: string): string => {
    const match = userAgent.match(/Android\s+([\d.]+)/);
    return match ? match[1] : 'Unknown';
  };

  const getDeviceManufacturer = (userAgent: string): string => {
    const manufacturers = ['Samsung', 'Huawei', 'OnePlus', 'Xiaomi', 'LG', 'Sony', 'Google'];
    for (const manufacturer of manufacturers) {
      if (userAgent.includes(manufacturer)) {
        return manufacturer;
      }
    }
    return 'Unknown';
  };

  const isEmulator = (userAgent: string): boolean => {
    return userAgent.toLowerCase().includes('emulator') || 
           userAgent.includes('Android SDK built for x86');
  };

  if (Capacitor.getPlatform() !== 'android') {
    return (
      <Alert>
        <AlertDescription>
          This diagnostic tool is specifically for Android devices experiencing 
          Credential Manager authentication errors.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 Android Credential Manager Diagnostic
          <Badge variant="outline">Android Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription>
            <strong>🎯 Specific Error Detected:</strong><br />
            <code>android.credentials.CredentialManager: No credentials available</code>
            <br /><br />
            This is an Android system-level error, not an app configuration issue.
          </AlertDescription>
        </Alert>

        {diagnostics && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Device Information:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Platform:</strong> {diagnostics.platform}</div>
              <div><strong>Android Version:</strong> {diagnostics.androidVersion}</div>
              <div><strong>Manufacturer:</strong> {diagnostics.deviceManufacturer}</div>
              <div><strong>Emulator:</strong> {diagnostics.isEmulator ? '⚠️ Yes' : '✅ No'}</div>
            </div>
          </div>
        )}

        {compatibility && (
          <div className="space-y-3">
            <div className={`p-3 rounded-lg ${compatibility.compatible ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <h3 className="font-semibold mb-2">
                {compatibility.compatible ? '✅ Device Compatible' : '⚠️ Compatibility Issues'}
              </h3>
              
              {compatibility.issues.length > 0 && (
                <div className="mb-2">
                  <strong>Issues:</strong>
                  <ul className="list-disc list-inside ml-2 text-sm">
                    {compatibility.issues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {compatibility.recommendations.length > 0 && (
                <div>
                  <strong>Recommendations:</strong>
                  <ul className="list-disc list-inside ml-2 text-sm">
                    {compatibility.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={testCredentialManager} variant="default" size="sm">
            Test Credential Manager
          </Button>
          <Button onClick={runDiagnostics} variant="outline" size="sm">
            Refresh Diagnostics
          </Button>
        </div>

        {testResult && (
          <Alert>
            <AlertDescription>
              <strong>Test Result:</strong><br />
              {testResult}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            🔧 Credential Manager Fix Steps
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <div>
              <strong>1. Add Google Account:</strong>
              <br />Settings → Accounts & Backup → Manage Accounts → Add Account → Google
            </div>
            <div>
              <strong>2. Update Google Play Services:</strong>
              <br />Play Store → Search "Google Play Services" → Update
            </div>
            <div>
              <strong>3. Clear Google Play Services Cache:</strong>
              <br />Settings → Apps → Google Play Services → Storage → Clear Cache & Data
            </div>
            <div>
              <strong>4. Restart Device:</strong>
              <br />Power off and restart your device
            </div>
            <div>
              <strong>5. Alternative:</strong>
              <br />Use phone number authentication (works on all devices)
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">
            📱 Expected Resolution
          </h3>
          <div className="text-sm text-green-700">
            <p>After following the fix steps:</p>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>The app will detect available Google accounts</li>
              <li>Credential Manager will have credentials to work with</li>
              <li>Google sign-in should work normally</li>
              <li>If not, the app will automatically fall back to web authentication</li>
            </ul>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <strong>Technical Note:</strong> This error occurs at the Android OS level when the 
          Credential Manager API cannot find any Google accounts configured for authentication. 
          It's not related to your app configuration or Firebase setup.
        </div>
      </CardContent>
    </Card>
  );
};