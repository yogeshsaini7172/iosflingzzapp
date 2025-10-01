#!/bin/bash

echo "🔍 ANDROID AUTH DEBUG SCRIPT"
echo "================================"

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Please run this from the root of your project"
    exit 1
fi

echo "📱 Current SHA-1 fingerprint:"
cd android && ./gradlew signingReport | grep -A 2 -B 2 "SHA1:" | head -10

echo ""
echo "🔧 Firebase Configuration Check:"
if [ -f "android/app/google-services.json" ]; then
    echo "✅ google-services.json exists"
    cat android/app/google-services.json | grep -E "(project_id|package_name|certificate_hash)" | head -5
else
    echo "❌ google-services.json NOT FOUND"
fi

echo ""
echo "⚡ Capacitor Configuration:"
if [ -f "capacitor.config.ts" ]; then
    echo "✅ capacitor.config.ts exists"
    grep -A 5 -B 5 "serverClientId" capacitor.config.ts
else
    echo "❌ capacitor.config.ts NOT FOUND"
fi

echo ""
echo "📦 Dependencies Check:"
echo "Capacitor Firebase Auth version:"
npm list @capacitor-firebase/authentication 2>/dev/null | grep @capacitor-firebase/authentication || echo "❌ Not installed"

echo ""
echo "🎯 Next Steps:"
echo "1. Build and run: npm run android:build"
echo "2. Test on device with Google Play Services"
echo "3. Check Android Studio Logcat for detailed errors"
echo "4. Use the AndroidAuthDebug component for detailed testing"