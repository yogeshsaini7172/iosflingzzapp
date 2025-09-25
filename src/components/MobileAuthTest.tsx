// Mobile Auth Test Component
// Add this to your app for quick testing

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const MobileAuthTest: React.FC = () => {
  const { signInWithGoogle, user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing Google login...');
      const result = await signInWithGoogle();
      
      if (result.error) {
        setError(result.error);
        console.error('❌ Login failed:', result.error);
      } else {
        console.log('✅ Login successful:', result.user?.uid);
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
    } catch (err) {
      console.error('❌ Sign out error:', err);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'white', 
      padding: 20, 
      border: '1px solid #ccc',
      borderRadius: 8,
      zIndex: 9999,
      minWidth: 200
    }}>
      <h3>🧪 Auth Test</h3>
      
      {!user ? (
        <div>
          <button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            style={{
              background: '#4285f4',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 4,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '⏳ Loading...' : '🔗 Test Google Login'}
          </button>
          
          {error && (
            <div style={{ color: 'red', marginTop: 10, fontSize: 12 }}>
              ❌ {error}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ color: 'green', fontSize: 12 }}>
            ✅ Logged in: {user.email}
          </div>
          <button 
            onClick={handleSignOut}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              marginTop: 10
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

// To use this component, add it to your App.tsx:
// import { MobileAuthTest } from './components/MobileAuthTest';
// Then add <MobileAuthTest /> inside your main component