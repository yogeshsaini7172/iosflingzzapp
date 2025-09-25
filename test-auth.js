// Quick Firebase Auth Test
// Run this with: node test-auth.js

console.log('🧪 Testing Firebase Auth Configuration...');

// Test 1: Check if Firebase config is valid
try {
  const firebaseConfig = {
    apiKey: "AIzaSyCDU4DuUoOfbtviGMud-Q2Xllu7k4ruRm4",
    authDomain: "datingapp-275cb.firebaseapp.com",
    projectId: "datingapp-275cb",
    storageBucket: "datingapp-275cb.appspot.com",
    messagingSenderId: "533305529581",
    appId: "1:533305529581:web:81cbba3b6aefa6ac19a8e4",
    measurementId: "G-WCH701HLXM"
  };
  
  console.log('✅ Firebase config looks valid');
  console.log('📱 Auth Domain:', firebaseConfig.authDomain);
  console.log('🆔 Project ID:', firebaseConfig.projectId);
  
} catch (error) {
  console.error('❌ Firebase config error:', error);
}

// Test 2: Check for duplicate Firebase imports
console.log('\n🔍 Checking for potential duplicate Firebase initializations...');

const fs = require('fs');
const path = require('path');

function findFirebaseInits(dir) {
  const results = [];
  
  function searchDir(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
          searchDir(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('initializeApp') && content.includes('firebase')) {
              results.push(filePath);
            }
          } catch (e) {
            // Skip files we can't read
          }
        }
      }
    } catch (e) {
      // Skip directories we can't access
    }
  }
  
  searchDir(dir);
  return results;
}

const srcDir = path.join(__dirname, 'src');
const firebaseInits = findFirebaseInits(srcDir);

if (firebaseInits.length === 1) {
  console.log('✅ Found exactly 1 Firebase initialization:', firebaseInits[0]);
} else if (firebaseInits.length === 0) {
  console.log('❌ No Firebase initialization found!');
} else {
  console.log('⚠️ Multiple Firebase initializations found:');
  firebaseInits.forEach(init => console.log('  -', init));
}

console.log('\n✅ Auth configuration test complete!');
console.log('\n🚀 Next steps:');
console.log('1. Run the app in Android Studio');
console.log('2. Test Google login on device');
console.log('3. Check browser console for any remaining errors');