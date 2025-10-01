# 🔥 Firebase Google Authentication Setup

## Current Issue:
Google Sign-In shows "null object reference" error because SHA-1 fingerprint is missing.

## ✅ Step-by-Step Fix:

### 1. Enable Google Sign-In in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `datingapp-275cb`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. **Enable** it if not already enabled
6. Save the changes

### 2. Add SHA-1 Fingerprint (CRITICAL)
1. Open **Android Studio**
2. Open **Terminal** in Android Studio
3. Run this command:
   ```bash
   cd android
   ./gradlew signingReport
   ```
4. Look for the **debug** section and copy the **SHA1** fingerprint
5. Go back to **Firebase Console** → **Project Settings**
6. Scroll to **Your Apps** section
7. Click on your **Android app** (`com.gradsync.app`)
8. Click **Add Fingerprint**
9. Paste the **SHA1** you copied
10. Click **Save**

### 3. Download Updated Configuration
1. In Firebase Console, go to **Project Settings**
2. Scroll to **Your Apps** → **Android App**
3. Click **Download google-services.json**
4. Replace the file in your project: `android/app/google-services.json`

### 4. Sync and Test
```bash
npm run build
npx cap sync android
npx cap run android
```

## 🎯 Expected Result:
- ✅ Google Sign-In button works without errors  
- ✅ Native Google authentication flow opens
- ✅ Successful sign-in with Google account

## 🔍 Debug SHA-1 Command:
If the above doesn't work, try getting SHA-1 with:
```bash
cd android
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## 📱 Alternative: Phone Authentication
Phone authentication should work without SHA-1 configuration, so you can test that while setting up Google auth.