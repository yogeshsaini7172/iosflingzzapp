// Enhanced Mobile Authentication Test
// This component helps debug and test Firebase Auth on mobile devices

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const EnhancedMobileAuthTest: React.FC = () => {
  const { signInWithGoogle, user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Detect environment and storage capabilities
    const detectEnvironment = () => {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isWebView = navigator.userAgent.includes('wv') || navigator.userAgent.includes('WebView');
      const isCapacitor = navigator.userAgent.includes('Capacitor');
      
      // Test sessionStorage
      let sessionStorageWorks = false;
      try {
        sessionStorage.setItem('__test__', 'test');
        sessionStorage.removeItem('__test__');
        sessionStorageWorks = true;
      } catch (e) {
        sessionStorageWorks = false;
      }

      // Test localStorage
      let localStorageWorks = false;
      try {
        localStorage.setItem('__test__', 'test');
        localStorage.removeItem('__test__');
        localStorageWorks = true;
      } catch (e) {
        localStorageWorks = false;
      }

      return {
        isMobile,
        isWebView,
        isCapacitor,
        sessionStorageWorks,
        localStorageWorks,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
    };

    setDebugInfo(detectEnvironment());
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Starting enhanced Google login test...');
      console.log('🔍 Environment:', debugInfo);
      
      const result = await signInWithGoogle();
      
      if (result.error) {
        setError(result.error);
        console.error('❌ Login failed:', result.error);
      } else {
        console.log('✅ Login successful:', result.user?.uid);
        console.log('👤 User info:', {
          uid: result.user?.uid,
          email: result.user?.email,
          displayName: result.user?.displayName
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('✅ Sign out successful');
      setError(null);
    } catch (err) {
      console.error('❌ Sign out error:', err);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      left: 10, 
      background: 'rgba(255, 255, 255, 0.95)', 
      padding: 15, 
      border: '2px solid #4285f4',
      borderRadius: 8,
      zIndex: 9999,
      minWidth: 250,
      maxWidth: 300,
      fontSize: 12,
      fontFamily: 'monospace'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4285f4' }}>🧪 Enhanced Auth Test</h3>
      
      {/* Environment Info */}
      {debugInfo && (
        <div style={{ marginBottom: 10, background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
          <div><strong>📱 Mobile:</strong> {debugInfo.isMobile ? '✅' : '❌'}</div>
          <div><strong>🌐 WebView:</strong> {debugInfo.isWebView ? '✅' : '❌'}</div>
          <div><strong>⚡ Capacitor:</strong> {debugInfo.isCapacitor ? '✅' : '❌'}</div>
          <div><strong>💾 Session Storage:</strong> {debugInfo.sessionStorageWorks ? '✅' : '❌'}</div>
          <div><strong>💿 Local Storage:</strong> {debugInfo.localStorageWorks ? '✅' : '❌'}</div>
        </div>
      )}

      {!user ? (
        <div>
          <button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            style={{
              background: isLoading ? '#ccc' : '#4285f4',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: 4,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              width: '100%',
              marginBottom: 8
            }}
          >
            {isLoading ? '⏳ Testing Login...' : '🔗 Test Google Login'}
          </button>
          
          {error && (
            <div style={{ 
              color: '#d32f2f', 
              marginTop: 8, 
              padding: 8,
              background: '#ffebee',
              borderRadius: 4,
              fontSize: 11
            }}>
              <strong>❌ Error:</strong><br />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ 
            color: '#2e7d32', 
            fontSize: 11, 
            marginBottom: 8,
            padding: 8,
            background: '#e8f5e8',
            borderRadius: 4
          }}>
            <div><strong>✅ Logged in!</strong></div>
            <div><strong>👤 Email:</strong> {user.email}</div>
            <div><strong>🆔 UID:</strong> {user.uid?.substring(0, 8)}...</div>
          </div>
          <button 
            onClick={handleSignOut}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      )}
      
      <div style={{ 
        marginTop: 8, 
        fontSize: 10, 
        color: '#666',
        borderTop: '1px solid #eee',
        paddingTop: 8
      }}>
        🕒 {debugInfo?.timestamp}
      </div>
    </div>
  );
};

export default EnhancedMobileAuthTest;