import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { Capacitor } from '@capacitor/core';

// Mobile-focused Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDUxEo0-TWkqlxZfVzSx6YYBMWACqxrXvM",
  authDomain: "datingapp-275cb.firebaseapp.com",
  projectId: "datingapp-275cb",
  storageBucket: "datingapp-275cb.firebasestorage.app",
  messagingSenderId: "533305529581",
  appId: "1:533305529581:android:17d81a31875aa07f19a8e4",  // Android app ID
  measurementId: "G-WCH701HLXM"
};

console.log('🔧 Mobile Firebase config loaded:', { 
  platform: Capacitor.getPlatform(),
  appId: firebaseConfig.appId
});

// Initialize Firebase once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;
