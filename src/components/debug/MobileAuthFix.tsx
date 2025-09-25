import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

export const MobileAuthFix: React.FC = () => {
  const [authState, setAuthState] = useState({
    canUseSessionStorage: false,
    canUseLocalStorage: false,
    userAgent: '',
    isCapacitor: false,
    platform: '',
    authError: null as string | null,
    isLoading: false
  });

  useEffect(() => {
    // Test storage availability
    const testStorage = () => {
      let sessionStorageWorks = false;
      let localStorageWorks = false;

      try {
        sessionStorage.setItem('test', '1');
        sessionStorage.removeItem('test');
        sessionStorageWorks = true;
      } catch (e) {
        console.log('SessionStorage test failed:', e);
      }

      try {
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
        localStorageWorks = true;
      } catch (e) {
        console.log('LocalStorage test failed:', e);
      }

      setAuthState(prev => ({
        ...prev,
        canUseSessionStorage: sessionStorageWorks,
        canUseLocalStorage: localStorageWorks,
        userAgent: navigator.userAgent,
        isCapacitor: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform()
      }));
    };

    testStorage();
  }, []);

  const clearAllAuth = () => {
    try {
      // Clear Firebase auth keys
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('firebase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });

      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes('firebase') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });

      console.log('🧹 Cleared all auth storage');
    } catch (e) {
      console.log('Error clearing storage:', e);
    }
  };

  const attemptGoogleAuth = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, authError: null }));
    
    try {
      console.log('🔄 Attempting Google auth with storage clear...');
      
      // Clear storage first
      clearAllAuth();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Attempt auth
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Auth successful:', result.user.email);
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        authError: null 
      }));
      
    } catch (error: any) {
      console.error('❌ Auth failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        authError: error.message || error.code 
      }));
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-3">🔧 Mobile Auth Diagnostics</h3>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div>SessionStorage: {authState.canUseSessionStorage ? '✅' : '❌'}</div>
        <div>LocalStorage: {authState.canUseLocalStorage ? '✅' : '❌'}</div>
        <div>Capacitor: {authState.isCapacitor ? '✅' : '❌'}</div>
        <div>Platform: {authState.platform}</div>
      </div>
      
      <div className="text-xs mb-3 text-gray-600">
        UserAgent: {authState.userAgent.substring(0, 100)}...
      </div>
      
      {authState.authError && (
        <div className="bg-red-100 border border-red-300 p-2 rounded mb-3 text-sm">
          <strong>Auth Error:</strong> {authState.authError}
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={clearAllAuth}
          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
        >
          Clear Auth Storage
        </button>
        
        <button
          onClick={attemptGoogleAuth}
          disabled={authState.isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-gray-400"
        >
          {authState.isLoading ? 'Authenticating...' : 'Test Google Auth'}
        </button>
      </div>
    </div>
  );
};