import { getAuth } from 'firebase/auth';
import { auth } from '../firebase';
import { supabase } from '@/integrations/supabase/client';

export async function fetchWithFirebaseAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = auth.currentUser;
  const headers = new Headers(init.headers || {});
  
  // Get Firebase ID token
  if (user) {
    try {
      const token = await user.getIdToken(true); // Force refresh to get valid token
      console.log(`🔑 Using refreshed Firebase token for request - User: ${user.email} (${user.uid})`);
      
      // Validate token format
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      // Send Firebase token as Bearer token (Edge Functions expect it here)
      headers.set('Authorization', `Bearer ${token}`);
      
      // Do NOT send x-firebase-token header due to CORS restrictions; Authorization Bearer is sufficient
      // Also add Supabase anon key as apikey header (for Supabase client operations)
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U';
      headers.set('apikey', supabaseAnonKey);
      
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cchvsqeqiavhanurnbeo.supabase.co';
    const directUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    
    console.log(`🌐 Making request to function: ${functionName}`);
    
    // Parse the body if it's JSON
    let bodyData: any = {};
    if (init.body && typeof init.body === 'string') {
      try {
        bodyData = JSON.parse(init.body);
      } catch (e) {
        console.error('Failed to parse body', e);
      }
    }
    
    // Try direct fetch first - more reliable for CORS
    console.log(`🌐 Making direct request to: ${directUrl}`);
    console.log(`🔑 Headers:`, Object.fromEntries(headers.entries()));
    
    try {
      const response = await fetch(directUrl, { 
        ...init, 
        headers,
        credentials: 'omit',
        mode: 'cors'
      });
      
      console.log(`📥 Response status: ${response.status} ${response.statusText}`);
      
      // Log response body for errors (only for actual errors, not 200 with error in body)
      if (!response.ok && response.status >= 500) {
        const responseText = await response.clone().text();
        console.error(`❌ Response error body:`, responseText);
      }
      
      return response;
    } catch (fetchError) {
      console.error(`❌ Direct fetch failed:`, fetchError);
      console.error('Fetch error details:', {
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
        stack: fetchError instanceof Error ? fetchError.stack : undefined
      });
      console.log(`🔄 Trying Supabase client as fallback...`);
      
      // Fallback to Supabase client if direct fetch fails
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: bodyData,
          headers: Object.fromEntries(headers.entries())
        });
        
        if (error) {
          console.error(`❌ Supabase client also failed:`, error);
          throw new Error(error.message || 'Failed to invoke function');
        }
        
        console.log(`✅ Supabase client succeeded`, data);
        return new Response(JSON.stringify(data), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (supabaseError) {
        console.error(`❌ Both direct fetch and Supabase client failed`);
        throw fetchError; // Throw the original fetch error
      }
    }
  }
  
  // For non-function URLs, use direct fetch
  console.log(`🌐 Making direct request to: ${url}`);
  try {
    return await fetch(input, { ...init, headers, credentials: 'omit', mode: 'cors' });
  } catch (error) {
    console.error(`❌ Fetch failed for ${url}:`, error);
    throw error;
  }
}