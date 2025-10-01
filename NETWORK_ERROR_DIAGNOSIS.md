# NETWORK ERROR DIAGNOSIS AND FIXES

## 🚨 Current Issue: `auth/network-request-failed`

This error occurs consistently after ~40 seconds when attempting Google Sign-In in Android WebView (Capacitor). 

## 🔍 Root Cause Analysis

The error suggests one of these issues:
1. **Network Security Policy**: Android's network security config is blocking Firebase requests
2. **Emulator Network Restrictions**: Android emulator networking issues
3. **Firebase Configuration**: Missing or incorrect Firebase project setup
4. **WebView Limitations**: Capacitor WebView blocking external requests

## 🛠️ Applied Fixes

### 1. Enhanced Error Handling (`src/services/auth.ts`)
- Added retry mechanism for network failures
- Creates fresh GoogleAuthProvider on network errors
- Clears auth state before retry attempts
- Provides better error messages

### 2. Gradle Configuration Fixed (`android/app/build.gradle`)
- Added Firebase BoM (Bill of Materials)
- Added Firebase Auth and Analytics dependencies
- Added Google Play Services Auth
- Updated Google Services plugin to 4.4.3

### 3. Test Functions Created (`src/services/authTest.ts`)
- Simple authentication test bypassing complex logic
- Firebase connectivity test
- Network diagnostics

## 🧪 IMMEDIATE TESTING STEPS

### In Android Studio:
1. **Clean and Rebuild Project**:
   - Build → Clean Project
   - Build → Rebuild Project

2. **Check Build Output**:
   Look for: `Parsing json file: google-services.json`

3. **Test Basic Firebase**:
   - Add temporary logging in the app
   - Check if Firebase initializes properly

### Android Network Security (Critical Check):

Create this file: `android/app/src/main/res/xml/network_security_config.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
    <domain-config>
        <domain includeSubdomains="true">firebase.googleapis.com</domain>
        <domain includeSubdomains="true">securetoken.googleapis.com</domain>
        <domain includeSubdomains="true">accounts.google.com</domain>
        <domain includeSubdomains="true">oauth2.googleapis.com</domain>
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </domain-config>
</network-security-config>
```

Then update `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

## 🔧 Alternative Solutions if Network Error Persists

### Option 1: Use Device Instead of Emulator
- Network issues are common in Android emulators
- Test on actual Android device via USB debugging

### Option 2: Capacitor Browser Plugin (Already installed)
- Uses system browser for OAuth instead of WebView
- Bypasses WebView network restrictions
- More reliable for OAuth flows

### Option 3: Update Firebase Project Settings
In Firebase Console:
1. Check **Authentication** → **Sign-in method** → **Google** is enabled
2. Verify **Project Settings** → **Your apps** → Android app configuration
3. Add debug SHA-1 fingerprint for development

## 📱 TESTING CHECKLIST

- [ ] **Clean and rebuild Android project**
- [ ] **Check Firebase initialization logs**
- [ ] **Test on real device (not emulator)**
- [ ] **Add network security config**
- [ ] **Verify internet connectivity in app**
- [ ] **Check Firebase Console configuration**

## 🚨 If All Else Fails

The nuclear options:
1. **Create new Firebase project** and migrate
2. **Use phone authentication only** (bypass Google auth)
3. **Implement custom OAuth** with backend server
4. **Use Capacitor Browser plugin** for OAuth

## 📊 Expected Outcome

After applying these fixes:
- ✅ No more `auth/network-request-failed` errors
- ✅ Google Sign-In completes in <10 seconds
- ✅ Proper error messages for genuine network issues
- ✅ Retry mechanism for transient failures

Try these fixes and let me know which one resolves the issue!