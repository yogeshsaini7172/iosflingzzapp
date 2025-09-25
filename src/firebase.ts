import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCDU4DuUoOfbtviGMud-Q2Xllu7k4ruRm4",
  authDomain: "datingapp-275cb.firebaseapp.com",
  projectId: "datingapp-275cb",
  storageBucket: "datingapp-275cb.appspot.com", // ✅ must be .appspot.com
  messagingSenderId: "533305529581",
  appId: "1:533305529581:web:81cbba3b6aefa6ac19a8e4",
  measurementId: "G-WCH701HLXM"
};

// ✅ Initialize once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Enhanced Google Auth Provider for mobile compatibility
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
  prompt: "select_account",
  // Enhanced parameters for WebView/mobile experience
  access_type: 'online',
  include_granted_scopes: 'true'
});

// Add required scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.addScope('openid');

export default app;
