// Debug Location Feature - Test in Browser Console
// Copy and paste this code into your browser console to test location functionality

// Test 1: Check if location APIs are available
console.log('🔍 Testing Location Feature Debug');
console.log('================================');

console.log('1. Geolocation API available:', 'geolocation' in navigator);
console.log('2. Current URL:', window.location.href);

// Test 2: Test location permission
if ('permissions' in navigator) {
  navigator.permissions.query({name: 'geolocation'}).then(result => {
    console.log('3. Geolocation permission:', result.state);
  });
} else {
  console.log('3. Permissions API not available');
}

// Test 3: Test IP-based location (as fallback)
fetch('https://ipapi.co/json/')
  .then(response => response.json())
  .then(data => {
    console.log('4. IP-based location:', {
      city: data.city,
      region: data.region,
      country: data.country_name,
      lat: data.latitude,
      lon: data.longitude
    });
  })
  .catch(error => {
    console.log('4. IP-based location failed:', error.message);
  });

// Test 4: Test Firebase auth token
async function testLocationSave() {
  try {
    console.log('5. Testing location save...');
    
    // Get current user (if using Firebase)
    const user = window.firebase?.auth?.currentUser;
    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    console.log('✅ User authenticated:', user.uid);
    
    // Get ID token
    const token = await user.getIdToken();
    console.log('✅ Got Firebase token');
    
    // Test location update
    const testLocation = {
      city: 'Test City',
      region: 'Test Region', 
      country: 'Test Country',
      latitude: 40.7128,
      longitude: -74.0060
    };
    
    const response = await fetch('/functions/v1/data-management', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'update_profile',
        profile: {
          location: JSON.stringify(testLocation),
          latitude: testLocation.latitude,
          longitude: testLocation.longitude,
          city: testLocation.city,
        },
      }),
    });
    
    console.log('6. Response status:', response.status);
    
    const result = await response.json();
    console.log('7. Response data:', result);
    
    if (response.ok) {
      console.log('✅ Location save successful!');
    } else {
      console.log('❌ Location save failed:', result.message || result.error);
    }
    
  } catch (error) {
    console.log('❌ Error testing location save:', error.message);
  }
}

// Test 5: Test location hook (if available)
if (window.React) {
  console.log('8. React is available - you can test the useLocation hook');
} else {
  console.log('8. React not available in console context');
}

console.log('');
console.log('🧪 To run manual tests:');
console.log('- testLocationSave() - Test saving location to database');
console.log('- navigator.geolocation.getCurrentPosition(pos => console.log(pos), err => console.log(err)) - Test GPS');

// Make function available globally
window.testLocationSave = testLocationSave;