import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { Capacitor } from '@capacitor/core';

const webConfig = {
  apiKey: "AIzaSyCDU4DuUoOfbtviGMud-Q2Xllu7k4ruRm4",
  authDomain: "datingapp-275cb.firebaseapp.com",
  projectId: "datingapp-275cb",
  storageBucket: "datingapp-275cb.appspot.com",
  messagingSenderId: "533305529581",
  appId: "1:533305529581:web:81cbba3b6aefa6ac19a8e4",
  measurementId: "G-WCH701HLXM"
};

const nativeConfig = {
  apiKey: "AIzaSyDUxEo0-TWkqlxZfVzSx6YYBMWACqxrXvM", // ✅ Matches android config
  authDomain: "datingapp-275cb.firebaseapp.com",
  projectId: "datingapp-275cb",
  storageBucket: "datingapp-275cb.firebasestorage.app", // ✅ Updated to match android
  messagingSenderId: "533305529581",
  appId: "1:533305529581:android:17d81a31875aa07f19a8e4", // ✅ Android app ID
  measurementId: "G-WCH701HLXM"
};

const isNative = Capacitor.isNativePlatform() || ['android','ios'].includes(Capacitor.getPlatform());
const firebaseConfig = isNative ? nativeConfig : webConfig;

// ✅ Initialize once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Note: Google provider is now created per-request in auth service
// to avoid mobile compatibility issues

export default app;
