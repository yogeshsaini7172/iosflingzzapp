import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  ensureAllSystemsReady, 
  getInitializationState, 
  resetInitializationState 
} from '../../services/initializationManager';
import { googleLogin } from '../../services/auth';

export default function TimingFixTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const runTimingTest = async () => {
    setIsLoading(true);
    setProgress(0);
    setCurrentStep('Starting timing test...');
    
    try {
      // Step 1: Reset state
      setProgress(20);
      setCurrentStep('Resetting initialization state...');
      resetInitializationState();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Test system initialization
      setProgress(40);
      setCurrentStep('Testing system initialization...');
      const startTime = Date.now();
      const systemsReady = await ensureAllSystemsReady();
      const initTime = Date.now() - startTime;

      // Step 3: Get initialization state
      setProgress(60);
      setCurrentStep('Checking initialization state...');
      const initState = getInitializationState();

      // Step 4: Test Google authentication
      setProgress(80);
      setCurrentStep('Testing Google authentication...');
      let authResult = null;
      let authError = null;
      
      try {
        const authStartTime = Date.now();
        authResult = await googleLogin();
        const authTime = Date.now() - authStartTime;
        authResult.timing = authTime;
      } catch (error: any) {
        authError = error.message;
      }

      setProgress(100);
      setCurrentStep('Test complete!');

      setTestResults({
        systemsReady,
        initTime,
        initState,
        authResult,
        authError,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⏱️ Timing Fix Verification Test
        </CardTitle>
        <CardDescription>
          Tests the timing fixes implemented to resolve "no credential" authentication errors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTimingTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Running Test...' : '🧪 Run Timing Test'}
        </Button>

        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">{currentStep}</p>
          </div>
        )}

        {testResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">System Initialization</h4>
                <Badge variant={testResults.systemsReady ? 'default' : 'destructive'}>
                  {testResults.systemsReady ? '✅ Ready' : '❌ Failed'}
                </Badge>
                {testResults.initTime && (
                  <p className="text-sm">Time: {testResults.initTime}ms</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Authentication</h4>
                <Badge variant={testResults.authResult?.user ? 'default' : 'destructive'}>
                  {testResults.authResult?.user ? '✅ Success' : '❌ Failed'}
                </Badge>
                {testResults.authResult?.timing && (
                  <p className="text-sm">Time: {testResults.authResult.timing}ms</p>
                )}
              </div>
            </div>

            {testResults.initState && (
              <div className="space-y-2">
                <h4 className="font-semibold">Initialization State</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Capacitor: {testResults.initState.capacitor ? '✅' : '❌'}</div>
                  <div>Firebase: {testResults.initState.firebase ? '✅' : '❌'}</div>
                  <div>Plugins: {testResults.initState.plugins ? '✅' : '❌'}</div>
                  <div>Ready: {testResults.initState.ready ? '✅' : '❌'}</div>
                </div>
              </div>
            )}

            {testResults.authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="font-semibold text-red-800">Authentication Error</h4>
                <p className="text-sm text-red-600">{testResults.authError}</p>
              </div>
            )}

            {testResults.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="font-semibold text-red-800">Test Error</h4>
                <p className="text-sm text-red-600">{testResults.error}</p>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-800">💡 What This Test Shows</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• System initialization timing (should be &lt; 3 seconds)</li>
                <li>• Component readiness state for debugging</li>
                <li>• Authentication flow success/failure</li>
                <li>• Total authentication timing</li>
              </ul>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>Expected Results:</strong></p>
          <p>• System initialization: &lt; 3000ms</p>
          <p>• All components ready: ✅</p>
          <p>• Authentication: Success or specific error message</p>
        </div>
      </CardContent>
    </Card>
  );
}