// Server-only Supabase client for public operations
// DO NOT USE THIS FOR AUTHENTICATED OPERATIONS
// Use fetchWithFirebaseAuth for all user-specific operations

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cchvsqeqiavhanurnbeo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U";

// Client for public operations only (real-time subscriptions, public data)
// ALL AUTHENTICATED OPERATIONS MUST USE fetchWithFirebaseAuth
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});