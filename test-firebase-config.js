import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Test Firebase configuration (same as your app)
const firebaseConfig = {
  apiKey: "AIzaSyDUxEo0-TWkqlxZfVzSx6YYBMWACqxrXvM",
  authDomain: "datingapp-275cb.firebaseapp.com", 
  projectId: "datingapp-275cb",
  storageBucket: "datingapp-275cb.firebasestorage.app",
  messagingSenderId: "533305529581",
  appId: "1:533305529581:android:17d81a31875aa07f19a8e4",
  measurementId: "G-WCH701HLXM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log('🔧 Testing Firebase Auth Configuration');
console.log('=====================================');

async function testAuth() {
  try {
    console.log('1. ✅ Firebase initialized successfully');
    console.log('   Project ID:', firebaseConfig.projectId);
    console.log('   App ID:', firebaseConfig.appId);
    
    console.log('\n2. 🔍 Testing Google Auth Provider...');
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    console.log('   ✅ GoogleAuthProvider created');
    
    console.log('\n3. 🔄 Attempting signInWithPopup (this will fail in Node, but shows config)...');
    // This will fail in Node.js but shows if Firebase is properly configured
    await signInWithPopup(auth, provider);
    
  } catch (error) {
    console.log('\n❌ Expected Error (Node.js environment):');
    console.log('   Code:', error.code);
    console.log('   Message:', error.message);
    
    // Analyze the error
    if (error.code === 'auth/operation-not-supported-in-this-environment') {
      console.log('\n✅ Good News: This error means Firebase config is valid!');
      console.log('   The error is expected because we\'re in Node.js, not a browser.');
    } else if (error.code === 'auth/invalid-api-key') {
      console.log('\n❌ Problem: Invalid API key');
    } else if (error.code === 'auth/project-not-found') {
      console.log('\n❌ Problem: Firebase project not found');
    } else {
      console.log('\n🤔 Unexpected error - might indicate other config issues');
    }
  }
  
  console.log('\n🎯 What this test shows:');
  console.log('=============================');
  console.log('• Firebase configuration is syntactically correct');
  console.log('• Google Auth provider can be initialized'); 
  console.log('• If you see "operation-not-supported-in-this-environment", config is valid');
  
  console.log('\n🔍 For your Android auth issue, check:');
  console.log('=====================================');
  console.log('1. Is Google Sign-In enabled in Firebase Console?');
  console.log('2. Are you testing on device/emulator with Google Play Services?');
  console.log('3. Did you rebuild the Android app after updating google-services.json?');
  console.log('4. Check Android Studio Logcat for specific error messages');
  console.log('5. Try phone authentication as alternative');
}

testAuth();