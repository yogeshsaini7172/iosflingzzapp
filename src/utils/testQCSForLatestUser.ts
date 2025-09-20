import { calculateQCS } from '@/services/qcs';

// Test QCS for the latest user who has 0 QCS score
const testUserId = 'R3wKDOX6o5bDdhGgPeBRoiocg4W2';

console.log(`🔄 Testing QCS calculation for latest user: ${testUserId}`);

calculateQCS(testUserId).then(score => {
  console.log(`✅ QCS calculation result for ${testUserId}: ${score}`);
}).catch(error => {
  console.error(`❌ QCS calculation failed for ${testUserId}:`, error);
});

export {};