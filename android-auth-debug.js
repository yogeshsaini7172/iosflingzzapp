// Add this to your AuthContext or auth service to get detailed logs

// Enhanced debugging for Android authentication
if (Capacitor.getPlatform() === 'android') {
  console.log('🔍 Android Auth Debug Info:');
  console.log('  Platform:', Capacitor.getPlatform());
  console.log('  Is Native:', Capacitor.isNativePlatform());
  console.log('  User Agent:', navigator.userAgent);
  
  // Test Google Play Services availability
  if (window.gapi) {
    console.log('  ✅ Google APIs available');
  } else {
    console.log('  ❌ Google APIs not available - possible Google Play Services issue');
  }
}

// Before attempting Google sign-in, add:
console.log('🔄 Attempting Google sign-in with config:');
console.log('  Server Client ID:', serverClientId);
console.log('  Firebase Project:', auth.app.options.projectId);
console.log('  App ID:', auth.app.options.appId);