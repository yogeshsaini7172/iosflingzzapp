import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const AuthStatusChecker = () => {
  const { user, isLoading, isAuthenticated, userId, getIdToken } = useAuth();

  const handleTestToken = async () => {
    try {
      const token = await getIdToken();
      console.log('🔑 Current token:', token ? 'Valid token available' : 'No token');
      
      if (token) {
        // Decode token to check payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', {
          iss: payload.iss,
          aud: payload.aud,
          sub: payload.sub,
          exp: new Date(payload.exp * 1000),
          email: payload.email
        });
      }
    } catch (error) {
      console.error('❌ Token test failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Loading...</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <Badge variant={isAuthenticated ? "default" : "destructive"}>
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>
        
        {user && (
          <>
            <div className="text-sm">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="text-sm">
              <strong>User ID:</strong> {userId}
            </div>
            <div className="text-sm">
              <strong>Display Name:</strong> {user.displayName || 'Not set'}
            </div>
            <div className="text-sm">
              <strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}
            </div>
            <Button onClick={handleTestToken} variant="outline" size="sm">
              Test Token
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};