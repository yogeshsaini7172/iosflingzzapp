#!/usr/bin/env node

/**
 * Auth Configuration Debug Script
 * This script helps diagnose Firebase Authentication setup issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Firebase Authentication Configuration Debug\n');

// 1. Check google-services.json
console.log('1. 📱 Checking google-services.json configuration...');
try {
  const googleServices = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'android/app/google-services.json'), 
    'utf8'
  ));
  
  console.log('   ✅ Project ID:', googleServices.project_info.project_id);
  console.log('   ✅ Package Name:', googleServices.client[0].client_info.android_client_info.package_name);
  
  const oauthClients = googleServices.client[0].oauth_client;
  console.log('   ✅ OAuth Client Count:', oauthClients.length);
  
  // Check for Android SHA-1 fingerprints
  const androidClients = oauthClients.filter(client => client.client_type === 1);
  console.log('   📋 Android SHA-1 Fingerprints:');
  androidClients.forEach((client, index) => {
    console.log(`      ${index + 1}. ${client.android_info.certificate_hash}`);
  });
  
  // Check for web client
  const webClient = oauthClients.find(client => client.client_type === 3);
  if (webClient) {
    console.log('   ✅ Web Client ID:', webClient.client_id);
  } else {
    console.log('   ⚠️  No web client found');
  }
  
} catch (error) {
  console.log('   ❌ Error reading google-services.json:', error.message);
}

// 2. Check Capacitor configuration
console.log('\n2. ⚡ Checking Capacitor configuration...');
try {
  const capacitorConfig = fs.readFileSync(
    path.join(__dirname, 'capacitor.config.ts'), 
    'utf8'
  );
  
  // Extract serverClientId
  const serverClientIdMatch = capacitorConfig.match(/serverClientId:\s*["']([^"']+)["']/);
  if (serverClientIdMatch) {
    console.log('   ✅ Server Client ID:', serverClientIdMatch[1]);
  } else {
    console.log('   ⚠️  Server Client ID not found');
  }
  
  // Check if Firebase Authentication plugin is configured
  if (capacitorConfig.includes('FirebaseAuthentication')) {
    console.log('   ✅ Firebase Authentication plugin configured');
  } else {
    console.log('   ❌ Firebase Authentication plugin not configured');
  }
  
} catch (error) {
  console.log('   ❌ Error reading capacitor.config.ts:', error.message);
}

// 3. Check package.json for required dependencies
console.log('\n3. 📦 Checking package.json dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'package.json'), 
    'utf8'
  ));
  
  const requiredDeps = {
    '@capacitor-firebase/authentication': packageJson.dependencies['@capacitor-firebase/authentication'],
    'firebase': packageJson.dependencies['firebase'],
    '@capacitor/core': packageJson.dependencies['@capacitor/core']
  };
  
  Object.entries(requiredDeps).forEach(([dep, version]) => {
    if (version) {
      console.log(`   ✅ ${dep}: ${version}`);
    } else {
      console.log(`   ❌ ${dep}: Not installed`);
    }
  });
  
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

// 4. Check Android build configuration
console.log('\n4. 🤖 Checking Android build configuration...');
try {
  const buildGradle = fs.readFileSync(
    path.join(__dirname, 'android/app/build.gradle'), 
    'utf8'
  );
  
  if (buildGradle.includes('com.google.gms.google-services')) {
    console.log('   ✅ Google services plugin applied');
  } else {
    console.log('   ❌ Google services plugin not applied');
  }
  
  // Check package name in build.gradle
  const packageNameMatch = buildGradle.match(/applicationId\s*["']([^"']+)["']/);
  if (packageNameMatch) {
    console.log('   ✅ Application ID:', packageNameMatch[1]);
  }
  
} catch (error) {
  console.log('   ❌ Error reading build.gradle:', error.message);
}

// 5. Check network security config
console.log('\n5. 🌐 Checking network security configuration...');
try {
  const networkConfig = fs.readFileSync(
    path.join(__dirname, 'android/app/src/main/res/xml/network_security_config.xml'), 
    'utf8'
  );
  
  const firebaseDomains = [
    'firebase.googleapis.com',
    'securetoken.googleapis.com', 
    'identitytoolkit.googleapis.com',
    'accounts.google.com'
  ];
  
  firebaseDomains.forEach(domain => {
    if (networkConfig.includes(domain)) {
      console.log(`   ✅ ${domain} allowed`);
    } else {
      console.log(`   ⚠️  ${domain} not explicitly allowed`);
    }
  });
  
} catch (error) {
  console.log('   ⚠️  Network security config not found (using default)');
}

console.log('\n🎯 Diagnostic Summary:');
console.log('=====================================');
console.log('If all items above show ✅, your configuration should be correct.');
console.log('Common remaining issues:');
console.log('• App needs to be rebuilt and synced after config changes');
console.log('• Firebase project settings need to match exactly');
console.log('• Device/emulator might need to be restarted');
console.log('• Check Firebase Console for any project-level restrictions');

console.log('\n🛠️ Next Steps if Auth Still Fails:');
console.log('1. Run: npm run android:build');
console.log('2. Clean and rebuild in Android Studio');
console.log('3. Test on physical device (not just emulator)');
console.log('4. Check Firebase Console > Authentication > Users for successful sign-ins');
console.log('5. Monitor Android Studio Logcat for detailed error messages');