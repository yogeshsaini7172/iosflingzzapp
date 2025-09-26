import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../contexts/AuthContext';

export const DeviceAuthHelper: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { signInWithGoogle } = useAuth();

  const analyzeDevice = () => {
    const userAgent = navigator.userAgent || '';
    const platform = Capacitor.getPlatform();
    
    const info = {
      platform,
      isNative: Capacitor.isNativePlatform(),
      userAgent,
      isEmulator: detectEmulator(userAgent),
      hasGoogleServices: detectGoogleServices(userAgent),
      deviceModel: extractDeviceModel(userAgent),
      androidVersion: extractAndroidVersion(userAgent),
    };
    
    setDeviceInfo(info);
  };

  const detectEmulator = (userAgent: string): boolean => {
    const emulatorIndicators = ['Emulator', 'Android SDK built for x86', 'Genymotion', 'generic'];
    return emulatorIndicators.some(indicator => 
      userAgent.toLowerCase().includes(indicator.toLowerCase())
    );
  };

  const detectGoogleServices = (userAgent: string): boolean => {
    return userAgent.includes('Chrome') && !userAgent.includes('HuaweiBrowser');
  };

  const extractDeviceModel = (userAgent: string): string => {
    const match = userAgent.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Unknown';
  };

  const extractAndroidVersion = (userAgent: string): string => {
    const match = userAgent.match(/Android\s+([\d.]+)/);
    return match ? match[1] : 'Unknown';
  };

  const testGoogleAuth = async () => {
    setTestResult('Testing...');
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setTestResult(`❌ Error: ${result.error}`);
      } else {
        setTestResult('✅ Success! Google authentication worked.');
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  const getDeviceGuidance = () => {
    if (!deviceInfo) return null;

    const issues = [];
    const solutions = [];

    if (deviceInfo.isEmulator) {
      issues.push('Emulator detected');
      solutions.push('Use an emulator with Google Play Store');
      solutions.push('Test on a physical device');
    }

    if (!deviceInfo.hasGoogleServices) {
      issues.push('Google Services may not be available');
      solutions.push('Ensure Google Play Services is installed and updated');
      solutions.push('Add a Google account to this device');
    }

    if (deviceInfo.userAgent.includes('Huawei') || deviceInfo.userAgent.includes('HMS')) {
      issues.push('Huawei device - limited Google services');
      solutions.push('Use phone authentication instead');
    }

    return { issues, solutions };
  };

  const guidance = getDeviceGuidance();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Device Authentication Helper
          <Badge variant="outline">Debug Mode</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={analyzeDevice} variant="outline" size="sm">
            Analyze This Device
          </Button>
          <Button onClick={testGoogleAuth} variant="default" size="sm">
            Test Google Sign-In
          </Button>
        </div>

        {deviceInfo && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
              <div><strong>Platform:</strong> {deviceInfo.platform}</div>
              <div><strong>Native App:</strong> {deviceInfo.isNative ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Emulator:</strong> {deviceInfo.isEmulator ? '⚠️ Yes' : '✅ No'}</div>
              <div><strong>Google Services:</strong> {deviceInfo.hasGoogleServices ? '✅ Detected' : '❌ Not detected'}</div>
              <div className="col-span-2"><strong>Device:</strong> {deviceInfo.deviceModel}</div>
              {deviceInfo.androidVersion !== 'Unknown' && (
                <div className="col-span-2"><strong>Android:</strong> {deviceInfo.androidVersion}</div>
              )}
            </div>

            {guidance && (guidance.issues.length > 0 || guidance.solutions.length > 0) && (
              <Alert>
                <AlertDescription>
                  {guidance.issues.length > 0 && (
                    <div className="mb-2">
                      <strong>⚠️ Potential Issues:</strong>
                      <ul className="list-disc list-inside ml-2">
                        {guidance.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {guidance.solutions.length > 0 && (
                    <div>
                      <strong>✅ Recommended Solutions:</strong>
                      <ul className="list-disc list-inside ml-2">
                        {guidance.solutions.map((solution, index) => (
                          <li key={index}>{solution}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {testResult && (
          <Alert>
            <AlertDescription>
              <strong>Test Result:</strong> {testResult}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>💡 Quick Fix for "No credentials available":</strong>
          <br />
          1. Go to device Settings → Accounts → Add Google account
          <br />
          2. Update Google Play Services in Play Store
          <br />
          3. Use phone authentication as alternative
          <br />
          4. Test on different device if issue persists
        </div>

        <div className="text-xs text-gray-500 bg-green-50 p-3 rounded">
          <strong>🎯 Device Comparison:</strong>
          <br />
          Run this tool on both your working device and failing device to see the differences.
          The working device likely has proper Google account setup and updated Play Services.
        </div>
      </CardContent>
    </Card>
  );
};