import { Capacitor } from '@capacitor/core';
import { auth } from '../firebase';

/**
 * TIMING ISSUE FIX - INITIALIZATION MANAGER
 * 
 * This module handles all timing-related initialization issues that can cause
 * "no credential" errors during authentication.
 */

interface InitializationState {
  capacitor: boolean;
  firebase: boolean;
  plugins: boolean;
  ready: boolean;
}

let initState: InitializationState = {
  capacitor: false,
  firebase: false,
  plugins: false,
  ready: false
};

// Check if Capacitor is fully initialized
export async function ensureCapacitorReady(): Promise<boolean> {
  console.log('🔄 Checking Capacitor readiness...');
  
  // On web, Capacitor is always ready (no native platform needed)
  if (typeof Capacitor !== 'undefined' && 
      typeof Capacitor.getPlatform === 'function') {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      console.log('✅ Running on web - Capacitor check skipped');
      initState.capacitor = true;
      return true;
    }
    
    // For native platforms, wait for proper initialization
    for (let attempts = 0; attempts < 50; attempts++) {
      try {
        if (Capacitor.isNativePlatform()) {
          console.log('✅ Capacitor is ready');
          initState.capacitor = true;
          return true;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.error('❌ Capacitor readiness timeout');
  return false;
}

// Check if Firebase is fully initialized
export async function ensureFirebaseReady(): Promise<boolean> {
  console.log('🔄 Checking Firebase readiness...');
  
  for (let attempts = 0; attempts < 30; attempts++) {
    try {
      if (auth && 
          auth.app && 
          typeof auth.currentUser !== 'undefined' &&
          auth.app.options &&
          auth.app.options.projectId) {
        
        console.log('✅ Firebase is ready');
        initState.firebase = true;
        return true;
      }
    } catch (error) {
      // Continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.error('❌ Firebase readiness timeout');
  return false;
}

// Check if Firebase Authentication plugin is ready (mobile only)
export async function ensureAuthPluginReady(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('ℹ️ Not on native platform, skipping plugin check');
    initState.plugins = true;
    return true;
  }
  
  console.log('🔄 Checking Firebase Auth plugin readiness...');
  
  for (let attempts = 0; attempts < 30; attempts++) {
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      
      // Try to call a simple method to verify plugin is loaded
      await FirebaseAuthentication.getCurrentUser();
      
      console.log('✅ Firebase Auth plugin is ready');
      initState.plugins = true;
      return true;
    } catch (error) {
      // Plugin not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.error('❌ Firebase Auth plugin readiness timeout');
  return false;
}

// Master initialization function with proper timing
export async function ensureAllSystemsReady(): Promise<boolean> {
  console.log('🚀 Initializing all systems with timing protection...');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Ensure Capacitor is ready
    const capacitorReady = await ensureCapacitorReady();
    if (!capacitorReady) {
      throw new Error('Capacitor initialization failed');
    }
    
    // Step 2: Ensure Firebase is ready
    const firebaseReady = await ensureFirebaseReady();
    if (!firebaseReady) {
      throw new Error('Firebase initialization failed');
    }
    
    // Step 3: Ensure auth plugin is ready (mobile only)
    const pluginReady = await ensureAuthPluginReady();
    if (!pluginReady) {
      throw new Error('Firebase Auth plugin initialization failed');
    }
    
    // Step 4: Add final stabilization delay
    console.log('⏳ Final stabilization delay...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    initState.ready = true;
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ All systems ready in ${totalTime}ms`);
    console.log('📊 Initialization state:', initState);
    
    return true;
    
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    console.log('📊 Failed initialization state:', initState);
    return false;
  }
}

// Quick check if systems are already ready (to avoid unnecessary delays)
export function areSystemsReady(): boolean {
  return initState.ready;
}

// Reset initialization state (useful for retries)
export function resetInitializationState(): void {
  console.log('🔄 Resetting initialization state');
  initState = {
    capacitor: false,
    firebase: false,
    plugins: false,
    ready: false
  };
}

// Get current initialization state for debugging
export function getInitializationState(): InitializationState {
  return { ...initState };
}

// Timing-aware wrapper for authentication functions
export async function withTimingProtection<T>(
  authFunction: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎯 Auth attempt ${attempt}/${maxRetries}`);
      
      // Ensure systems are ready before attempting auth
      if (!areSystemsReady()) {
        console.log('⏳ Systems not ready, initializing...');
        const ready = await ensureAllSystemsReady();
        if (!ready) {
          throw new Error(`System initialization failed on attempt ${attempt}`);
        }
      }
      
      // Execute the auth function
      return await authFunction();
      
    } catch (error: any) {
      console.error(`❌ Auth attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying in 1 second... (attempt ${attempt + 1}/${maxRetries})`);
        
        // Reset state for retry
        resetInitializationState();
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Maximum retry attempts exceeded');
}