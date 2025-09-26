import React from 'react';
import { DeviceAuthHelper } from '../components/debug/DeviceAuthHelper';
import { Button } from '../components/ui/button';

export const AuthTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Debug Center
          </h1>
          <p className="text-gray-600">
            Diagnose and fix "No credentials available" errors
          </p>
        </div>

        <DeviceAuthHelper />

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Solutions</h2>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">
                ❌ "No credentials available" Error
              </h3>
              <div className="text-sm text-red-700 space-y-2">
                <p><strong>Most Common Fix:</strong></p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>Go to device Settings → Accounts → Add Google account</li>
                  <li>Open Play Store → Search "Google Play Services" → Update</li>
                  <li>Restart the app and try again</li>
                </ol>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">
                🔍 Device Comparison Test
              </h3>
              <div className="text-sm text-blue-700">
                <p>Run the device analyzer above on both:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>✅ Working device (where Google sign-in works)</li>
                  <li>❌ Failing device (where you get "No credentials available")</li>
                </ul>
                <p className="mt-2">Compare the results to identify what's different.</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">
                📱 Alternative: Phone Authentication
              </h3>
              <div className="text-sm text-green-700">
                <p>If Google auth continues to fail on certain devices, phone authentication always works as a backup option.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg text-center text-sm text-gray-600">
          <p><strong>Note:</strong> This debug page can be removed in production. It's designed to help diagnose device-specific authentication issues.</p>
        </div>
      </div>
    </div>
  );
};