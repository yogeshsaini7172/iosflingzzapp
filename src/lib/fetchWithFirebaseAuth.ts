import { getAuth } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';

export async function fetchWithFirebaseAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = auth.currentUser;
  const headers = new Headers(init.headers || {});
  
  // Add Firebase ID token to Authorization header
  if (user) {
    try {
      const token = await user.getIdToken(true); // Force refresh to get valid token
      headers.set('Authorization', `Bearer ${token}`);
      console.log(`🔑 Using refreshed Firebase token for request - User: ${user.email} (${user.uid})`);
      
      // Validate token format
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
    } catch (error) {
      console.error('❌ Error getting Firebase token:', error);
      // Clear invalid session
      await auth.signOut();
      throw new Error('Authentication failed - please sign in again');
    }
  } else {
    console.warn('⚠️ No authenticated user found');
    throw new Error('Not authenticated');
  }
  
  // Ensure JSON content type if sending JSON
  if (!headers.get('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  
  // Convert function URLs to direct Supabase function calls
  const url = typeof input === 'string' ? input : input.toString();
  const functionMatch = url.match(/\/functions\/v1\/([^/?]+)/);
  
  if (functionMatch) {
    const functionName = functionMatch[1];
    const supabaseUrl = 'https://cchvsqeqiavhanurnbeo.supabase.co';
    const directUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    
    return fetch(directUrl, { 
      ...init, 
      headers,
      credentials: 'same-origin'
    });
  }
  
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}