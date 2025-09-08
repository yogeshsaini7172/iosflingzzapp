import { getAuth } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';

export async function fetchWithFirebaseAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = auth.currentUser;
  const headers = new Headers(init.headers || {});
  
  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
  }
  
  // Ensure JSON header if sending JSON
  if (!headers.get('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  
  return fetch(input, { ...init, credentials: 'same-origin', headers });
}