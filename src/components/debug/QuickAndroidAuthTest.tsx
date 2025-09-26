import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

export const QuickAndroidAuthTest: React.FC = () => {
  const [testStatus, setTestStatus] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const { signInWithGoogle } = useAuth();

  const testCredentialManager = async () => {
    setTestStatus('🔄 Testing Android Credential Manager fix...');
    
    try {
      console.log('🧪 Starting Credential Manager test...');
      const result = await signInWithGoogle();
      
      if (result.error) {
        if (result.error.includes('No credentials available')) {
          setTestStatus('❌ Still getting "No credentials available" - device needs Google account setup');
        } else {
          setTestStatus(`❌ Error: ${result.error}`);
        }
      } else {
        setTestStatus('✅ SUCCESS! Authentication worked - Credential Manager issue resolved');
      }
    } catch (error: any) {
      console.error('Test error:', error);
      setTestStatus(`❌ Test failed: ${error.message}`);
    }
  };

  if (Capacitor.getPlatform() !== 'android') {
    return (
      <Alert>
        <AlertDescription>
          This test is specifically for Android Credential Manager issues.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🤖 Android Credential Manager Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription>
            <strong>This tests the specific fix for:</strong><br />
            <code>"android.credentials.CredentialManager: No credentials available"</code>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={testCredentialManager} variant="default">
            Test Google Sign-In Now
          </Button>
          <Button 
            onClick={() => setShowDetails(!showDetails)} 
            variant="outline"
            size="sm"
          >
            {showDetails ? 'Hide' : 'Show'} Fix Details
          </Button>
        </div>

        {testStatus && (
          <Alert className={testStatus.includes('SUCCESS') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <AlertDescription>
              <strong>Test Result:</strong><br />
              {testStatus}
            </AlertDescription>
          </Alert>
        )}

        {showDetails && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
            <div>
              <strong>🔧 If test still fails, try these steps:</strong>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
              <strong>1. Add Google Account:</strong><br />
              Settings → Accounts & backup → Manage accounts → Add account → Google
            </div>
            
            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
              <strong>2. Update Google Play Services:</strong><br />
              Play Store → Search "Google Play Services" → Update
            </div>
            
            <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
              <strong>3. Clear Play Services Data:</strong><br />
              Settings → Apps → Google Play Services → Storage → Clear cache & data
            </div>
            
            <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
              <strong>4. Restart Device:</strong><br />
              Power off and restart your Android device
            </div>

            <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
              <strong>5. Alternative:</strong><br />
              Use phone number authentication (works on all devices)
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded">
          <strong>What the fix does:</strong><br />
          • Detects Android Credential Manager errors automatically<br />
          • Falls back to web authentication when native fails<br />
          • Provides device-specific guidance for setup issues<br />
          • Works around Android system-level authentication problems
        </div>

      </CardContent>
    </Card>
  );
};