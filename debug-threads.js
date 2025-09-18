// Thread Debugging Utility
// Add this to your browser console to debug thread posting issues

const debugThreads = () => {
  console.log('🐛 Thread Debugging Info:');
  
  // Check Firebase auth
  const auth = firebase.auth ? firebase.auth() : null;
  console.log('🔥 Firebase Auth:', auth?.currentUser ? 
    { uid: auth.currentUser.uid, email: auth.currentUser.email } : 'Not authenticated');
  
  // Check if createThread function exists
  console.log('📝 Thread functions available:', {
    useThreads: typeof useThreads !== 'undefined',
    createThread: 'Check React component'
  });
  
  // Check network connectivity to Supabase
  fetch('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/thread-management', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list' })
  })
  .then(response => {
    console.log('🌐 Supabase Connection:', response.status === 200 ? 'OK' : `Error: ${response.status}`);
  })
  .catch(error => {
    console.log('🌐 Supabase Connection: Failed', error);
  });
  
  // Check local storage for any cached data
  console.log('💾 Local Storage Keys:', Object.keys(localStorage).filter(key => 
    key.includes('firebase') || key.includes('auth') || key.includes('thread')
  ));
};

// Call this in browser console
console.log('To debug threads, type: debugThreads()');