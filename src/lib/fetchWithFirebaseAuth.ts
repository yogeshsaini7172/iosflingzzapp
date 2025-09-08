import { getAuth } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';

// Decode Firebase JWT to extract user ID
function decodeFirebaseToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.user_id || payload.sub || null;
  } catch (error) {
    console.error('Error decoding Firebase token:', error);
    return null;
  }
}

export async function fetchWithFirebaseAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = auth.currentUser;
  const headers = new Headers(init.headers || {});
  
  // Set JSON content type
  headers.set('Content-Type', 'application/json');
  
  let body = init.body;
  
  if (user) {
    try {
      const token = await user.getIdToken();
      const userId = decodeFirebaseToken(token);
      
      if (userId) {
        // Add user_id to request body
        if (body && typeof body === 'string') {
          const existingData = JSON.parse(body);
          body = JSON.stringify({ ...existingData, user_id: userId });
        } else {
          body = JSON.stringify({ user_id: userId });
        }
      }
    } catch (error) {
      console.error('Error processing Firebase token:', error);
    }
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
      body,
      headers,
      credentials: 'omit' // No credentials needed for public functions
    });
  }
  
  return fetch(input, { ...init, body, headers, credentials: 'same-origin' });
}