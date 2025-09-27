#!/bin/bash

# APK Feature Verification Script
# This script helps verify all website features work in the Android APK

echo "🔍 APK FEATURE VERIFICATION CHECKLIST"
echo "====================================="

echo ""
echo "📱 1. CHECKING MOBILE APP CONFIGURATION..."

# Check if MobileApp.tsx has all routes
echo "   Checking MobileApp.tsx routes..."
if grep -q "/subscription" src/mobile/MobileApp.tsx; then
    echo "   ✅ Subscription route found"
else
    echo "   ❌ Subscription route missing"
fi

if grep -q "/blind-date" src/mobile/MobileApp.tsx; then
    echo "   ✅ Blind Date route found"
else
    echo "   ❌ Blind Date route missing"
fi

if grep -q "/qcs-" src/mobile/MobileApp.tsx; then
    echo "   ✅ QCS routes found"
else
    echo "   ❌ QCS routes missing"
fi

echo ""
echo "📋 2. CHECKING NAVIGATION COMPONENTS..."

# Check MobileBottomNav
if [ -f "src/components/navigation/MobileBottomNav.tsx" ]; then
    echo "   ✅ MobileBottomNav component exists"
else
    echo "   ❌ MobileBottomNav component missing"
fi

# Check MobileFeaturesMenu
if [ -f "src/components/navigation/MobileFeaturesMenu.tsx" ]; then
    echo "   ✅ MobileFeaturesMenu component exists"
else
    echo "   ❌ MobileFeaturesMenu component missing"
fi

echo ""
echo "🔧 3. CHECKING BUILD CONFIGURATION..."

# Check if build is up to date
if [ -d "dist" ]; then
    echo "   ✅ Build directory exists"
    DIST_FILES=$(find dist -name "*.js" | wc -l)
    echo "   📊 Built JS files: $DIST_FILES"
else
    echo "   ❌ Build directory missing - run 'npm run build:prod'"
fi

# Check Android assets
if [ -d "android/app/src/main/assets/public" ]; then
    echo "   ✅ Android assets directory exists"
    ASSET_FILES=$(find android/app/src/main/assets/public -name "*.js" | wc -l)
    echo "   📊 Android asset files: $ASSET_FILES"
else
    echo "   ❌ Android assets missing - run 'npx cap sync android'"
fi

echo ""
echo "📱 4. ANDROID APK FEATURE CHECKLIST"
echo ""

echo "Core Features that MUST work in APK:"
echo "   📍 Home/Dashboard (/)"
echo "   💖 Swipe Feature (/swipe)"
echo "   📰 Feed (/feed)"
echo "   👥 Pairing (/pairing)"
echo "   💕 Matches (/matches)"
echo "   💬 Chat System (/chat)"
echo "   👤 Profile (/profile)"

echo ""
echo "Premium Features:"
echo "   ✨ Blind Date (/blind-date)"
echo "   👑 Subscription (/subscription)"

echo ""
echo "System Tools:"
echo "   🧪 QCS Test (/qcs-test)"
echo "   🔍 QCS Diagnostics (/qcs-diagnostics)"
echo "   🔧 QCS Repair (/qcs-repair)"
echo "   🔄 QCS Bulk Sync (/qcs-bulk-sync)"

echo ""
echo "🎯 5. TESTING INSTRUCTIONS"
echo ""

echo "To verify APK has all features:"
echo "   1. Build APK: npm run android:build"
echo "   2. Install APK on Android device"
echo "   3. Open app and test navigation:"
echo "      - Tap bottom nav items (Home, Swipe, Chat, Profile)"
echo "      - Tap 'More' button to access features menu"
echo "      - Try navigating to each feature"
echo "      - Verify all features load without errors"

echo ""
echo "🔍 6. DEBUGGING FEATURES NOT WORKING"
echo ""

echo "If features don't work in APK:"
echo "   1. Check Android Studio Logcat for errors"
echo "   2. Verify route exists in MobileApp.tsx"
echo "   3. Check component imports are correct"
echo "   4. Ensure proper navigation props passed"
echo "   5. Test on web first to isolate mobile-specific issues"

echo ""
echo "🚀 7. BUILD COMMANDS"
echo ""

echo "Full APK build process:"
echo "   npm run build:prod          # Build for production"
echo "   npx cap sync android        # Sync to Android"
echo "   npx cap open android        # Open in Android Studio"

echo ""
echo "📊 Current Status Summary:"
echo "========================="

# Count total routes in MobileApp
MOBILE_ROUTES=$(grep -c "element={" src/mobile/MobileApp.tsx || echo "0")
echo "   📱 Mobile app routes: $MOBILE_ROUTES"

# Check key files exist
KEY_FILES=(
    "src/mobile/MobileApp.tsx"
    "src/components/navigation/MobileBottomNav.tsx"
    "src/components/navigation/MobileFeaturesMenu.tsx"
    "android/app/google-services.json"
    "capacitor.config.ts"
)

EXISTING_FILES=0
for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        EXISTING_FILES=$((EXISTING_FILES + 1))
    fi
done

echo "   📁 Key files present: $EXISTING_FILES/${#KEY_FILES[@]}"

if [ "$MOBILE_ROUTES" -ge "10" ] && [ "$EXISTING_FILES" -eq "${#KEY_FILES[@]}" ]; then
    echo ""
    echo "✅ APK CONFIGURATION LOOKS GOOD!"
    echo "   All components are in place for full feature parity"
    echo "   Ready to build and test APK"
else
    echo ""
    echo "⚠️  APK CONFIGURATION NEEDS ATTENTION"
    echo "   Some components may be missing"
    echo "   Review the checklist above"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Run this verification: npm run android:build"
echo "   2. Test APK on real Android device"
echo "   3. Use APKFeatureVerification component for detailed testing"
echo "   4. Report any features not working for specific fixes"