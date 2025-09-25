import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { Capacitor } from '@capacitor/core';

// Single unified Firebase config that works for both web and native
const firebaseConfig = {
  apiKey: "AIzaSyDUxEo0-TWkqlxZfVzSx6YYBMWACqxrXvM",
  authDomain: "datingapp-275cb.firebaseapp.com",
  projectId: "datingapp-275cb",
  storageBucket: "datingapp-275cb.firebasestorage.app",
  messagingSenderId: "533305529581",
  appId: Capacitor.isNativePlatform() 
    ? "1:533305529581:android:17d81a31875aa07f19a8e4"  // Native Android app ID
    : "1:533305529581:web:81cbba3b6aefa6ac19a8e4",    // Web app ID
  measurementId: "G-WCH701HLXM"
};

console.log('🔧 Firebase config selected:', { 
  platform: Capacitor.getPlatform(),
  isNative: Capacitor.isNativePlatform(),
  appId: firebaseConfig.appId
});

// Initialize Firebase once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;
